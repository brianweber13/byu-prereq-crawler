# BYU Prerequiste Crawler
Given a list of classes, this program determines which classes are prerequisites for other classes in that list and then presents a list of classes in the format `[class]: classes that this class is a prerequisite for`. This is useful when planning classes: it plays much the same role as a flowchart, but it is as up to date as the last time the script was run, whereas flowcharts are dependent on the department and often horribly out of date.

Sample input can be found in `SampleInput.txt`, but it's really pretty simple. Just write the short name of each class (ex. CS 235), one class per line.

Features:
 * Lines starting with `#` in the input file will be ignored.
