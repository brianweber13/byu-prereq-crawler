# BYU Prerequiste Crawler
Given a list of classes, this program determines which classes are prerequisites for other classes in that list and then presents a table of classes in the format `class: classes that 'class' is a prerequisite for`. This is useful when planning classes: it plays much the same role as a flowchart, but it is as up to date as the last time the script was run, whereas flowcharts are dependent on the department and often horribly out of date. In the future, I plan to extend this program to create a graphical flowchart as well.

This program is a website, and until it is hosted on a server, it can be used by cloning the repository and double-clicking on "byu-prereq-crawler.html"

Sample input is pre-populated in the textarea, but it's really pretty simple. Just write the short name of each class (ex. CS 235), one class per line.

I hope this tool will be useful to you as you plan your classes! Good luck!

## Features:
 * Lines starting with `#` in the input will be ignored.

## Disclaimer:
My program does its best to be a correct representation of BYU requirements, but it is not official software and should not be treated as such. Double-check all information you receive from this software with information gained from official BYU sources, such as the BYU website or a BYU counsellor.

Remember to consider the difficulty of the classes you are taking: just because a class doesn't have a prerequisite doesn't mean you should take it as soon as possible.

## History:
This started out as a little bash script and then changed into a website when I realized that using javascript would make processing html files much easier. Furthermore, creating a website would make my software more accessible: relatively few people know how to use a bash script when compared with the number of people who know how to use a website.
