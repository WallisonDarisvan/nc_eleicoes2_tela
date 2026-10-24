const fs = require('fs');
const content = fs.readFileSync('src/data/brazilGeoData.ts', 'utf8');

function splitSubPaths(d) {
  const subpaths = [];
  const regex = /([Mm][^Mm]+)/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    subpaths.push(match[1].trim());
  }
  return subpaths;
}

function getSubpathStats(sp, prevX = 0, prevY = 0) {
  const tokens = sp.match(/[a-zA-Z]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
  let curX = prevX, curY = prevY;
  let curCmd = '';
  let i = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[a-zA-Z]$/.test(t)) {
      curCmd = t;
      i++;
    } else {
      if (curCmd === 'M' || curCmd === 'L') {
        curX = parseFloat(t);
        curY = parseFloat(tokens[++i]);
        i++;
      } else if (curCmd === 'm' || curCmd === 'l') {
        curX += parseFloat(t);
        curY += parseFloat(tokens[++i]);
        i++;
      } else {
        curX += parseFloat(t);
        if (i + 1 < tokens.length && !/^[a-zA-Z]$/.test(tokens[i+1])) {
          curY += parseFloat(tokens[++i]);
        }
        i++;
      }
      if (curX < minX) minX = curX;
      if (curX > maxX) maxX = curX;
      if (curY < minY) minY = curY;
      if (curY > maxY) maxY = curY;
    }
  }
  return { minX, minY, maxX, maxY, curX, curY, text: sp };
}

const ufs = ['RN', 'PE', 'PB', 'CE', 'MA', 'PI', 'AL', 'SE', 'BA', 'ES'];
for (const uf of ufs) {
  const pattern = new RegExp(`'${uf}':\\s*\\{[\\s\\S]*?d:\\s*'([^']+)'`);
  const match = content.match(pattern);
  if (match) {
    const sps = splitSubPaths(match[1]);
    console.log(`=== ${uf} (total subpaths: ${sps.length}) ===`);
    let lastX = 0, lastY = 0;
    sps.forEach((sp, idx) => {
      const stats = getSubpathStats(sp, lastX, lastY);
      lastX = stats.curX;
      lastY = stats.curY;
      console.log(`  subpath ${idx}: minX=${stats.minX.toFixed(1)}, maxX=${stats.maxX.toFixed(1)}, minY=${stats.minY.toFixed(1)}, maxY=${stats.maxY.toFixed(1)}, len=${sp.length}`);
    });
  }
}
