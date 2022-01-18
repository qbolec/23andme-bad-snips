const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
// 23andme seems to use only these options, or at least these are the only ones I've withnessed in my DNA
const expected=['--','A','AA','AC','AG', 'AT', 'C', 'CC', 'CG', 'CT', 'D', 'DD', 'DI', 'G', 'GG', 'GT', 'I', 'II', 'T', 'TT'];
const handled =[         'AA','AC','AG', 'AT',      'CC', 'CG', 'CT',      'DD', 'DI',      'GG', 'GT',      'II',      'TT'];
// 23andme uses "D" to denote what SNPedia denotes by "-".
// 23andme uses "--" to mean "no call" (AFAIU: they could not determine result)
// 23andme uses "I" for insertion, which AFAICT means insertion of several characters, and this is a bit tricky to map to SNPedia,
// as it's not clear what characters. I guess, it's assummed that there's just one possible sequence which you either have or not.
// I mean, *maybe* you can have only DD, DI, II, or in SNPedia terms (-;-), (-;something), (something;something)?
// FWIW SNPedia does use (D;I), (D;D) and (I;I) notation for some genomes, so perhaps it's even simpler.
// These are the cases in 23andme report which we will handle.
// I ignore "no call" - there's too much of it to show warnings about them, and they aren't actionable as we don't know what bases you have.
// I ignore single-base entries, which seem to be used for X and Y chromosome.
// Honestly, I don't know how to handle reports for X or Y chromosome which have just one letter.
// AFAICS SNPedia entries are always for a pair of letters, for example Rs72558454 is on Chormosome X
// and 23andme report can contain:
// rs72558454      X       38268240        C
// so, just "C", but the SNPedia has entries for pairs:
// https://www.snpedia.com/index.php/Rs72558454(C;C)
// https://www.snpedia.com/index.php/Rs72558454(C;T)
// https://www.snpedia.com/index.php/Rs72558454(T;T)
// 23andme uses positive orientation https://www.snpedia.com/index.php/Orientation so if stabilizedOrientation in SNPedia was 'minus',
// we need to translate the characters to their opposites.
// Perhaps we should also reverse their order if there were more than one, but luckly 23andme only reports a single character from each
// chromosome.
const OPPOSITE = { G: "C",  C: "G",  T: "A",  A: "T",  D: "D",  I: "I" };

(async () => {
  const forPagesInDir = async (dir,foo) => (await fsPromises.readdir(dir)).map(filename=>path.join(dir,filename)).forEach(p=>{
    const pages=JSON.parse(fs.readFileSync(p,{ encoding: 'utf8' })).pages;
    Object.keys(pages).forEach( page => foo(pages[page],page,pages));
  });

  const orientations = new Map();
  await forPagesInDir('snips', (info,page) =>{
    const s_o=info.match(/\bStabilizedOrientation=(plus|minus)\b/);
    //const o=info.match(/\bOrientation=(plus|minus)\b/);
    if(s_o){
      orientations.set(page,s_o[1]);
    }
  })
  const badGenotypes = [];
  await forPagesInDir('genotypes', (info,genotype) =>{
    const snip = genotype.match(/^[^(]*/)[0];
    if(/repute=Bad/.test(info)){
      // If we don't know the orientation, but it's (I)nternal snip, then, assumming that it's internal to 23andme, it must be positive.
      const orientation = orientations.get(snip) || (snip[0]=='I' && 'plus');
      if(orientation!==undefined){
        const badParts=genotype.match(/[(](.*);(.*)[)]/).slice(1).sort();
        handled.filter(result => {
          const letters = result.split('').map(letter => orientation=='minus' ? OPPOSITE[letter] : letter).map(letter => letter=='D'?'-':letter).sort();
          // The difficult part is to handle insertions, the "I"s
          const insertions=letters.filter(part => part=="I").length;
          if(!insertions){
            // the easy case, just letters and "-", which should match exactly what's in SNPedia
            return badParts.join() == letters.join()
          }
          // There are some "I"s. We only handle II, and DI. ("-","I")
          const deletions = 2-insertions;
          const badDeletions = badParts.filter(part => part == "-" || part=="D").length;
          return deletions == badDeletions;
        }).forEach(result => badGenotypes.push(`${snip} ${result}:${genotype.substr(snip.length)}`));
      }else{
        console.log(`Sadly, ${genotype} is Bad, but we don't know it's orientation!`);
      }
    }
  })
  await fsPromises.writeFile("bad-list-for-23andme.txt", badGenotypes.join('\n') + '\n');
})();