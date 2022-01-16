const wikijs = require('wikijs').default;
const category = process.argv[2];

(async () => {
  const wiki = wikijs({ apiUrl: 'http://bots.snpedia.com/api.php' });
  const listMembers = await wiki.pagesInCategory(`Category:${category}`);
  process.stdout.write(listMembers.join('\n')+'\n');
})();
