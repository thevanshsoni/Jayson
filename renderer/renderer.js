const ndjsonBtn = document.querySelector('.ndjson-btn');
const commentsBtn = document.querySelector('.comments-btn');

commentsBtn.style.opacity = '0.5';
commentsBtn.style.pointerEvents = 'none';

let ndjsonButtonState = 'initial';
let fileContent = null;

ndjsonBtn.addEventListener('click', async () => {
  if (ndjsonButtonState === 'initial') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.ndjson,.jsonl';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      ndjsonBtn.innerHTML = `<img src="../assets/loader.gif" width="32" style="vertical-align: middle; margin-right: 10px;">`;
      
      try {
        fileContent = await file.text();
        const lines = fileContent.split('\n').filter(Boolean);
        const firstObj = JSON.parse(lines[0]);
        const subreddit = firstObj.subreddit || 'unknown';

        ndjsonBtn.innerHTML = `r/${subreddit}`;
        commentsBtn.style.opacity = '1';
        commentsBtn.style.pointerEvents = 'auto';
        ndjsonButtonState = 'ready';
      } catch (error) {
        console.error('Error processing file:', error);
        ndjsonBtn.innerHTML = 'Error! Click to try again';
      }
    };

    input.click();
  } else if (ndjsonButtonState === 'ready') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('open-viewer-window', {
      content: fileContent,
      filename: `r_${getSubredditName(fileContent)}_posts.ndjson`
    });
  }
});

function getSubredditName(content) {
  try {
    const firstLine = content.split('\n').filter(Boolean)[0];
    const firstObj = JSON.parse(firstLine);
    return firstObj.subreddit || 'unknown';
  } catch {
    return 'reddit';
  }
}