const wikijs = require('wikijs').default;
// Todo: this isn't really needed:
const {readFileSync} = require('fs');
const {writeFile} = require('fs/promises');
const names_path = process.argv[2];
const snips = readFileSync(names_path,{ encoding: 'utf8' }).split('\n').filter(x => /\d/.test(x));

const get = (obj, first, ...rest) => {
  if (obj === undefined || first === undefined) return obj;
  if (typeof first === 'function') {
    return get(first(obj), ...rest);
  }
  return get(obj[first], ...rest);
};
const sleep = n => new Promise((resolve)=>setTimeout(resolve,n));
(async () => {
  const wiki = wikijs({ apiUrl: 'http://bots.snpedia.com/api.php' });
  const LIMIT=50;
  async function processFragment(fragment){
    let content={fragment};
    const res = (await wiki.api({
      action:'query',
      prop:'revisions',
      rvprop:'content',
      rvsection:0,
      titles: fragment.join('|'),
      rvslots:'main'
    }));
    let pages={};
    Object.values(res.query.pages).map(page=>{
      pages[page.title] = get(page,'revisions',0,'slots','main','*');
    });
    return pages;
  }
  let flawless=true;
  for(let offset=0;offset<snips.length;offset+=LIMIT){
    const fragment = snips.slice(offset,offset+LIMIT);
    const path = `results/${offset}.json`;
    try{
      const old_content = readFileSync(path,{ encoding: 'utf8' });
      const old_result = old_content && JSON.parse(old_content);
      if(old_result.status=="ok" && old_result.fragment && old_result.fragment.join() == fragment.join()){
        continue;
      }
    }catch(e){
      console.log(`Couldn't parse file for offset ${offset}`,e);
      // continue;
    }
    console.log(`Need to download again fragment for offset ${offset}`);
    const result = {fragment};
    try{
      result.pages = await processFragment(fragment);
      result.status = 'ok';
    }catch(e){
      result.error = e.toString();
      result.status = 'error';
      flawless=false;
    }
    await writeFile(path, JSON.stringify(result,undefined,2) + "\n");
    await sleep(10000);
  }
  process.exit(flawless?0:1)
})();
