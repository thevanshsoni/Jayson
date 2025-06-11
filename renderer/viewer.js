const { ipcRenderer } = require('electron');

let allPosts = [];
let currentIndex = 0;
const BATCH_SIZE = 15;
let currentSort = 'newest';
let currentView = 'card';
let isLoading = false;

function formatNumber(num) {
  if (!num) return '0';
  return num >= 1000 ? (num/1000).toFixed(1) + 'k' : num;
}

function createPostCard(post) {
  const imageUrl = post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
  const upvotePercent = post.upvote_ratio ? Math.round(post.upvote_ratio * 100) : null;

  return `
    <div class="post-card">
      <div class="post-header">
        <span class="subreddit">r/${post.subreddit}</span>
        <span class="separator">•</span>
        <span class="author">u/${post.author}</span>
      </div>
      <h3 class="post-title">${post.title}</h3>
      
      ${imageUrl ? `
        <div class="post-image">
          <img src="${imageUrl}" loading="lazy" onerror="this.style.display='none'">
        </div>
      ` : ''}
      
      <div class="post-footer">
        <span class="score">${formatNumber(post.score)} points</span>
        <span class="separator">•</span>
        <span class="comments">${formatNumber(post.num_comments)} comments</span>
        ${upvotePercent ? `<span class="upvote-ratio">${upvotePercent}% upvoted</span>` : ''}
      </div>
    </div>
  `;
}

function createPostList(post) {
  return `
    <div class="post-list-item">
      <h3>${post.title}</h3>
      <div class="meta">
        <span class="subreddit">r/${post.subreddit}</span>
        <span class="score">${formatNumber(post.score)} points</span>
        <span class="comments">${formatNumber(post.num_comments)} comments</span>
      </div>
    </div>
  `;
}

function filterPosts(searchTerm) {
  if (!searchTerm) return allPosts;
  return allPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.selftext?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

function sortPosts(posts, sortBy) {
  const sorted = [...posts];
  switch(sortBy) {
    case 'newest':
      return sorted.sort((a,b) => b.created_utc - a.created_utc);
    case 'score':
      return sorted.sort((a,b) => b.score - a.score);
    case 'comments':
      return sorted.sort((a,b) => b.num_comments - a.num_comments);
    case 'alphabetical':
      return sorted.sort((a,b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

function loadNextBatch() {
  if (isLoading || currentIndex >= allPosts.length) return;
  
  isLoading = true;
  const container = document.querySelector(`.${currentView}-view`);
  if (!container) return;

  const loader = document.createElement('div');
  loader.className = 'loader';
  container.appendChild(loader);

  setTimeout(() => {
    const filtered = filterPosts(document.getElementById('search-input').value);
    const sorted = sortPosts(filtered, currentSort);
    
    const end = Math.min(currentIndex + BATCH_SIZE, sorted.length);
    for (let i = currentIndex; i < end; i++) {
      const postHTML = currentView === 'card' 
        ? createPostCard(sorted[i]) 
        : createPostList(sorted[i]);
      container.insertAdjacentHTML('beforeend', postHTML);
    }
    
    currentIndex = end;
    container.removeChild(loader);
    isLoading = false;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      loadNextBatch();
    }
  }, 100);
}

function handleScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    loadNextBatch();
  }
}

function initUI() {
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const viewButtons = document.querySelectorAll('.view-btn');
  
  searchInput.addEventListener('input', () => {
    currentIndex = 0;
    document.querySelector(`.${currentView}-view`).innerHTML = '';
    loadNextBatch();
  });
  
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    currentIndex = 0;
    document.querySelector(`.${currentView}-view`).innerHTML = '';
    loadNextBatch();
  });
  
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      document.querySelectorAll('.view-btn').forEach(b => 
        b.classList.toggle('active', b.dataset.view === currentView)
      );
      document.querySelectorAll('.view-container').forEach(div => 
        div.classList.toggle('active', div.classList.contains(`${currentView}-view`))
      );
      currentIndex = 0;
      document.querySelector(`.${currentView}-view`).innerHTML = '';
      loadNextBatch();
    });
  });
  
  document.getElementById('toggle-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  
  window.addEventListener('scroll', handleScroll);
}

ipcRenderer.on('load-ndjson-content', (event, fileData) => {
  try {
    allPosts = fileData.content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
  const cleanedName = fileData.filename
  .replace(/\.(ndjson|jsonl?|json)$/i, '') // 1. remove extension first
  .replace(/^r_/, '')                      // 2. remove 'r_' prefix
  .replace(/_posts$/, '');                 // 3. remove '_posts' suffix

    document.querySelector('.post-count').textContent = `${allPosts.length.toLocaleString()} Posts`;
    document.querySelector('.subreddit-name').textContent = `r/${cleanedName}`;
    currentIndex = 0;
    initUI();
    loadNextBatch();
  } catch (error) {
    document.getElementById('content').innerHTML = `
      <div class="error">
        <h2>Error loading content</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
});