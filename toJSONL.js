import fs from 'fs';

let data = fs .readFileSync('./dataset.jsonl', 'utf8');
data = JSON.parse(data);

let jsonl = '';

data.forEach((item) => {
  jsonl += JSON.stringify(item) + '\n';
});

fs.writeFileSync('data.jsonl', jsonl);
