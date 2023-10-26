let s: string[] = [];
s.push(`<canvas id="myCanvas" width="1000" height="500" style="border:1px solid #cccccc;">`);

s.push(`</canvas>`);
const content = document.getElementById('content');
console.log(content);
if (content) {
    content.innerHTML = s.join('');

}