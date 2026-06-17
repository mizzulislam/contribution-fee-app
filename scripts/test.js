const url = 'https://script.google.com/macros/s/AKfycbzFQNZOpyS7-zk6htH9Gm5Liyuu2T1hIn8YzQVcKouBLaE5Jv0-UzREgrjlg4H9mKqwuA/exec';

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  },
  body: JSON.stringify({
    action: 'delete',
    sheet: 'Users',
    id: 1780527957858
  })
}).then(res => res.json())
  .then(console.log)
  .catch(console.error);
