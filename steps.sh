#!/bin/bash
npm install
# I did this steps manually, actually, and I haven't tested this script yet, as it takes a day, to not overwhelm SNPedia
# Create the list of genotype names. A genotype is something like "Rs123(G;T)"
node download-category-list.js "Is a genotype" > genotypes.txt
# Create the list of snips. A snip is something like "Rs123"
node download-category-list.js "Is_a_snp" > snips.txt
# Even though genotypes correspond to snips, there are genotypes for which the snip page is missing and vice-versa.
# As we need both pieces of the puzzle, we intersect the two sets to get the common part.
comm -1 -2 <(cut -d '(' -f 1 genotypes.txt | sort | uniq) <(sort snips.txt) > common-snips.txt
join -t '(' <(sort -t '(' -k 1,1 genotypes.txt) common-snips.txt > common-genotypes.txt
# Download all wiki entries about genotypes.
# They are needed to learn if repute=Bad.
# It will create files results/$number.json
# Some of them will contain errors, or be missing, if your connection drops, or computer goes to sleep or something.
# The script is "idemptonent", in the sense that you can run it until it succeeds to avoid any errors.
until node download-pages.js common-genotypes.txt; do echo "There were some failures trying again"; done
mv results/ genotypes/
# Download all entries about snips. They are needed to learn if StabilizedOrientation=minus.
until node download-pages.js common-snips.txt; do echo "There were some failures trying again"; done
mv results/ snips/
# Combine the two downloaded sets of info from genotypes/ and snips/ into single bad-list-for-23andme.txt
node build-bad-list-for-23andme.js
# compress it
gzip -9 bad-list-for-23andme.txt
