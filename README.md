Purpose
=======
First of all, needless to say this is not a medical advice.
Which you should be able to tell, because I'm some random developer on github, not your doctor.
I've created this tool for my personal use, and there's no implied guarantee it will work for you, or that any medical or life decissions you'll make based on running it will be any good for you.
The 23andme.com doesn't provide health advice in some countries, and I bet there's a good moral reason for that.
But, they also let you download a zip file with the result of sequencing, just in case you'd like to do stuff with it.
One thing you could do is to upload it to some untrusty web-service which doesn't even specify clearly who and how they'll share your data with or who they are.
Another option is to upload it to some costly service.
Here I present a third option, which I found preferable: instead of uploading your DNA to third party for comparing with the body of scientific knowlege, download the database of this knowlege to your PC so you can perform the analysis offline.
This way your private data doesn't leave your PC, as the data is sent in the opposite direction.
This is made possible thanks to great project of https://www.snpedia.com/.
Based on scraping scripts you can find in this repo (but which you absolutely do not have to download or run yourself!) I've created a single file you need to download:
[bad-list-for-23andme.txt.gz](https://github.com/qbolec/23andme-bad-snips/blob/master/bad-list-for-23andme.txt.gz)
It contains the list of Snips that are likely to have "Bad" reputation according to info available in [SNPedia](https://www.snpedia.com/) at the moment of scraping.
Any errors in this file are due to my stupidity.

Usage
=====
Once you have downloaded [bad-list-for-23andme.txt.gz](https://github.com/qbolec/23andme-bad-snips/blob/master/bad-list-for-23andme.txt.gz) and also downloaded and extracted your [raw genome](https://you.23andme.com/tools/data/download/), open bash console (personally I use Git Bash on Windows) and run:
```
$ cat path/to/your/extracted_23andme_genome.txt | grep -e '^[^#]' | awk '{print $1, $4}' | sort -t ':' -k 1b,1 | join -i -t ':' <(gzip -dc bad-list-for-23andme.txt.gz | sort -t ':' -k 1b,1) - | sed -r 's@^([^ ]*) .*:(.*)$@https://bots.snpedia.com/index.php/\1\2@g'
```

That's a long command, but I don't see any other secure option for you to run some code from the internet, than this: to trust that `cat`, `grep`, `awk`, `sort`, `join`, `gzip` and `sed` will not send any of your private data over the internet.
What this command does is:
```
$ cat path/to/your/extracted_23andme_genome.txt | # load your genome file
  grep -e '^[^#]' | # ignore comments in it
  awk '{print $1, $4}' | # pick columns 1st (the RSid of the location) and 4th (the base pairs at it)
  sort -t ':' -k 1b,1 | # sort these two fields
  join -i -t ':' | # join two streams, case-insensitively, with ':' as column separator
    <( # where the first stream comes from the
      gzip -dc bad-list-for-23andme.txt.gz | # decompressed file you've downloaded
      sort -t ':' -k 1b,1 # sorted the same way
    ) - | # and the second file is your sorted genome
  sed -r 's@^([^ ]*) .*:(.*)$@https://bots.snpedia.com/index.php/\1\2@g' # for each match print a link to more info
```

Caveats
=======
One again, I don't know much about genetics.
This simple `join` isn't foolproof, obviously. Expect that you'll have to verify the results manually, and consult them with a doctor.
For example:
https://you.23andme.com/tools/data/?query=rs876659310
says I have  GAAAGGCCTTCTGGATTCT / GAAAGGCCTTCTGGATTCT, but the downloaded report says just:
```
rs876659310     17      41228571        II
```
The problem is that https://bots.snpedia.com/index.php/Rs876659310 shows that:
`(AGAATCCAGAAGGCCTTTC;AGAATCCAGAAGGCCTTTC)` is Good, but
`(AGAATCCAGAAGGCCTTTC;TTT)` is Bad,
and it's not obvious to me, which of the two `II` stands for.
In such cases, and perhaps others, you can get a false-positive warning, that your `II` is might be bad.

Another problem is that SNPedia can use a different refernce genome than 23andme.

Yet another is that the script doesn't handle genes appearing or X and Y chromosomes.

Licence
=======
This software, and the file to download is available under [Creative Commons Attribution-Noncommercial-Share Alike 3.0 United States License](https://creativecommons.org/licenses/by-nc-sa/3.0/us/).
