#!/bin/bash

# Given a list of classes (one class per line), creates list of what
# each class is a prerequisite for. This facilitates planning classes
# by making it easier to see what doors will open upon completing a
# given class.

#### Functions ####
print_usage(){
  echo 'Usage: byu-prereq-crawler <input file>'
}

err() {
  echo "ERROR [$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@" >&2
}

#### Main ####
if [[ ! "$1" ]] ; then
  err "No input file specified!"
  print_usage
  exit 1
elif [[ ! -e "$1" ]] ; then
  err "That file does not exist!"
  print_usage
  exit 1
elif [[ ! -r "$1" ]] ; then
  err "That file exists, but is not readable."
  exit 1
fi

mkdir -p tmp

while read line; do
  # Ignore lines that start with the hash
  if [[ "$line" =~ ^[^#].*$ ]]; then
    line=$(sed -r 's/ /+/g' <<< $line)
    search_url="https://catalog.byu.edu/search/site/$line"
    echo "$search_url"
    wget -O tmp/search-result.html "$search_url"

    # find link to actual course page
  fi
done <$1

# name a file in which to save the output

