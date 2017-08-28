/**
 * Type and callback definitions for JSDocs
 * @callback failureCallback - called when an asyncronous function fails.
 *   Will be given a message.
 * @param {errorMessage}
 *
 * @callback foundPrereqCallback - called when we find prereqs for a class
 * @param {(string|array)} prerequisites for single class
 *
 * @callback foundLinkToClassPageCallback - called when we find the link to
 *   a BYU course page
 * @param {string} linkToClassPage - link to BYU course catalog page
 *
 * @callback foundClassSearchResultsPage - called when we find the page of
 *   the search results for a short class name
 * @param {string} className - short name of BYU course
 *
 * @callback gotWebsiteHtmlCallback - called when we found an HTML doc
 * @param {string} htmlDocString - a valid HTML doc
 */

/**
 * Objects containing classinfo will have the following form:
 * {
 *   className: String,
 *   prerequisites: String[],
 *   isPrerequisiteFor: String[],
 * }
 *
 * this class gives a place to keep all these objects.
 */
class ByuClassInfo {
  /**
   * @param {string} className
   * @param {string|Array} prerequisites
   * @param {string|Array} isPrerequisiteFor
   */
  constructor(className, prerequisites, isPrerequisiteFor) {
    this.className = className;
    this.prerequisites = prerequisites;
    this.isPrerequisiteFor = isPrerequisiteFor;
  }
}

let getClassPrereqsAsyncFailureCount = 0;

/**
 * Wraps together all the other functions required to parse input, get the
 * required webpages, process the data, and output the results to the user.
 * (does not return anything, does not take any inputs. Gets inputs from
 * the textarea with id class-list-input)
 */
function outputPrereqList() {
  // TODO: fix the GET ERR_FILE_NOT_FOUND errors so they just don't show up
  console.log('FYI: there are lots of GET ERR_FILE_NOT_FOUND errors that ' +
    'will show up in the console. This is normal, as making a get request ' +
    'to BYU websites causes the website to expect BYU images on the server, ' +
    'even though they do not exist here.');
  info('Beginning to process classes....');
  let classList = document.querySelector('textarea#class-list-input').value;
  classList = parseClassList(classList);

  // TODO: add loading bar.
  let classInfoArray = [];
  getClassPrereqsAsyncFailureCount = 0;
  for (className of classList) {
    let localClassName = className;
    getPrerequisitesForClass(
      localClassName,
      (prereqList) => {
        // TODO: add loading bar.

        classInfoArray.push(new ByuClassInfo(localClassName, prereqList, []));
        if (classInfoArray.length === classList.length -
          getClassPrereqsAsyncFailureCount) {
          // DONE! Processed everything we can.
          if (getClassPrereqsAsyncFailureCount !== 0) {
            error('failed to process ' + getClassPrereqsAsyncFailureCount +
              ' classes. Generating results for the classes we successfully ' +
              'got information for.');
          }

          classInfoArray =
            addIsPrerequisiteForPropertyToClassObjects(classInfoArray);
        }
      },
      // TODO: it'd probably be good to move all the error reports to this
      // part. That way the other functions will be more modular, and the
      // medium of the error handling can be input the callback
      () => {
        // (failureReason) => {
        // TODO: 
        // error(failureReason);
        getClassPrereqsAsyncFailureCount++;
      }
    );
  }
}

/**
 * Prints an error (red text) to the html doc, under the textarea
 * input box.
 * @param {string} errorMessage
 */
function error(errorMessage) {
  alertOnPage(errorMessage, 'error-output-text');
}

/**
 * Prints an error (black text) to the html doc, under the textarea
 * input box.
 * @param {string} infoMessage
 */
function info(infoMessage) {
  alertOnPage(infoMessage, 'info-output-text');
}

/**
 * Adds a p element inside div#error-output-container with the given
 * message as contents and the given htmlClass as the class
 * @param {string} message
 * @param {string} htmlClass
 */
function alertOnPage(message, htmlClass) {
  let errorOutputContainer = document
    .querySelector('div#error-output-container').innerHTML;
  let date = new Date();
  let time = date.getHours() + ':' + date.getMinutes() + ':' +
    date.getSeconds();
  document.querySelector('div#error-output-container').innerHTML =
    ('<p class=' + htmlClass + '>' + time + ' ' + message + '</p>')
    + errorOutputContainer;
}

/**
 * Takes a list of classes as one string (each class is separated by a new
 * line), and returns an array that contains each class as a separate element.
 * Lines starting with '#' are ignored and strings are trimmed before being
 * added to the array.
 * @param {string} inputString
 * @return {(string|Array)}
 */
function parseClassList(inputString) {
  inputString = inputString.replace(/\r\n/g, '\n');
  inputString = inputString.replace(/\r/g, '\n');
  inputStringArray = inputString.split('\n');
  for (let i = 0; i < inputStringArray.length;) {
    if (inputStringArray[i].charAt(0) === '#') {
      inputStringArray.splice(i, 1);
    } else if ( inputStringArray[i].length === 0) {
      inputStringArray.splice(i, 1);
    } else {
      inputStringArray[i] = inputStringArray[i].trim();
      i++;
    }
  }
  return inputStringArray;
}

// TODO: convert async funtions to use promises instead. These might be
// helpful: 
// https://softwareengineering.stackexchange.com/questions/302455/is-there-really-a-fundamental-difference-between-callbacks-and-promises
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
/**
 * @param {string} className - short name of class as determined by BYU
 *   (for example, EC EN 220)
 * @param {foundPrereqCallback} successCallback - will be given an array
 *   of strings, where each string is a prereq.
 * @param {failureCallback} failureCallback
 */
function getPrerequisitesForClass(className, successCallback, failureCallback) {
  getClassSearchResultPage(className, (classSearchResultPage) => {
    parseClassPageFromSearchResultPage(className, classSearchResultPage,
      (classPage) => {
        parseClassPrerequisitesFromClassPage(className, classPage,
          successCallback, failureCallback);
      }, failureCallback);
  }, failureCallback);
}

/**
 * @param {string} htmlDocString - string that is a valid HTML document
 * @return {document} htmlDoc - HTML document that can be manipulated natively
 */
function createHtmlDocFromString(htmlDocString) {
  let htmlDoc = document.createElement( 'html' );
  htmlDoc.innerHTML = htmlDocString;
  return htmlDoc;
}

/**
 * Gets a class's prerequisites from the BYU course catalog page for that class.
 * @param {string} className - short name of BYU class
 * @param {string} htmlDocString - HTML doc for the class page for className on
 *   the BYU course catalog website
 * @param {foundPrereqCallback} successCallback
 * @param {failureCallback} failureCallback
 */
function parseClassPrerequisitesFromClassPage(className, htmlDocString,
  successCallback, failureCallback) {
  let htmlDoc = createHtmlDocFromString(htmlDocString);
  let courseData = htmlDoc.querySelectorAll('tr.course-data-row');
  let prerequisiteDataRow;
  for (let i = 0; i < courseData.length; i++) {
    if (courseData[i].innerHTML.match(/.*prerequisites.*/i)) {
      prerequisiteDataRow = courseData[i];
      break;
    }
    if ( i === courseData.length ) {
      errorMessage = 'we couldn\'t find prerequisite data for the class \''
        + className + '\'.';
      error(errorMessage);
      failureCallback(errorMessage);
    }
  }
  let prerequisiteLinks = prerequisiteDataRow.querySelectorAll('a');
  let prerequisites = [];
  for (prerequisiteLink of prerequisiteLinks) {
    prerequisites.push(prerequisiteLink.innerHTML);
  }
  successCallback(prerequisites);
}

/**
 * @param {string} className - short classname as given by BYU
 * @param {string} htmlDocString - HTML doc for page of the search results when
 *   searching className on the BYU course catalog, as a string
 * @param {foundLinkToClassPageCallback} successCallback - given link to the
 *   class page we found
 * @param {failureCallback} failureCallback - given error message
 */
function parseClassPageFromSearchResultPage(className, htmlDocString,
  successCallback, failureCallback) {
  let htmlDoc = createHtmlDocFromString(htmlDocString);
  let linksToResults = htmlDoc.querySelector('ol.search-results')
    .querySelectorAll('a');

  for (foundLink of linksToResults) {
    if (foundLink.innerHTML.match(new RegExp(className, 'i'))) {
      httpGetWebpageAsyncWithProxy(foundLink.getAttribute('href'),
        (response) => {
          successCallback(response);
        });
      return;
    }
  }
  errorMessage = 'we couldn\'t find the class \'' + className
    + '\'. Ensure that it\'s the exact name of the class in the'
    + 'byu catalog and try again!';
  error(errorMessage);
  failureCallback(errorMessage);
}

/**
 * this function is the first in a chain that will eventually get 
 * the prerequisites for a given class
 *
 * This function just gets the page as a string of an html doc
 * @param {string} className - short name of class as given by BYU
 * @param {foundClassSearchResultsPage} successCallback - given 
 *   html doc of search results page (as a string)
 * @param {failureCallback} failureCallback
 */
function getClassSearchResultPage(className, successCallback, failureCallback) {
  let classNameForSearch = className.replace(/ /g, '+');
  httpGetWebpageAsyncWithProxy('https://catalog.byu.edu/search/site/'
    + classNameForSearch, (response) => {
      successCallback(response);
    }, failureCallback);
}

/**
 * uses a proxy in order to use cors anywhere, even when the browser would
 * normally block http requests.
 * @param {string} pageUrl
 * @param {gotWebsiteHtmlCallback} successCallback - given a STRING that is
 *   a valid html doc
 * @param {failureCallback} failureCallback
 */
function httpGetWebpageAsyncWithProxy(pageUrl, successCallback,
  failureCallback) {
  // TODO: make custom proxy so I don't rely on someone else's
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  let xmlHttp = new XMLHttpRequest();

  xmlHttp.onload = () => {
    successCallback(xmlHttp.responseText);
  };
  xmlHttp.onerror = () => {
    console.log('error: ', xmlHttp);
    errorMessage = 'There was a problem retrieving ' + pageUrl
      + '. Make sure you\'re connected to the internet and that'
      + 'the website we\'re trying to retrieve is available. You'
      + 'can also hit Ctrl-Shift-I (Cmd-Opt-I on mac) and check'
      + 'the console for more info.';
    error(errorMessage);
    failureCallback(errorMessage);
  };
  xmlHttp.open('GET', proxyUrl + pageUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

/**
 * @param {ByuClassInfo|Array} classInfoArray
 * @return {string} classInfoTable - html table displaying data from array
 */
function buildPrerequisiteTable(classInfoArray) {
  let outputTable
    = '<table id=prerequisite-table>\n'
    + '  <tr>\n'
    + '    <th>Prerequisites</th>\n'
    + '    <th>Class</th>\n'
    + '    <th>Prerequisite For</th>\n'
    + '  </tr>\n';

  for (let classInfo of classInfoArray) {
    // add new table row
    outputTable += '  <tr>\n';

    // add contents to prerequisite column
    outputTable += '    <td>';
    for (let i = 0; i < classInfo.prerequisites.length; i++) {
      outputTable += classInfo.prerequisites[i];
      if (i < classInfo.prerequisites.length - 1) {
        outputTable += ', ';
      }
    }
    outputTable += '</td>\n';

    // add the name of the class
    outputTable += '    <td>' + classInfo.className + '</td>\n';

    // add the classes this class is a prerequisite for
    outputTable += '    <td>';
    for (let i = 0; i < classInfo.isPrerequisiteFor.length; i++) {
      outputTable += classInfo.prerequisites[i];
      if (i < classInfo.prerequisites.length - 1) {
        outputTable += ', ';
      }
    }
    outputTable += '</td>\n';

    // close the row
    outputTable += '  </tr>\n';
  }

  outputTable += '</table>';
  return outputTable;
}

/**
 * This function adds values to the array 'isPrerequisiteFor',
 * which is expected to be empty before this function is run.
 * This function runs on a given array and returns a new array with
 * the freshly-added isPrerequisiteFor properties.
 * @param {ByuClassInfo|Array} classInfoArray
 * @return {ByuClassInfo|Array} classInfoArray - new array with the 
 *   isPrerequisiteFor arrays populated as much as possible on each
 *   object.
 */
function addIsPrerequisiteForPropertyToClassObjects(classInfoArray) {
  for (classObj of classInfoArray) {
    for (classObjToCompare of classInfoArray) {
      for (classObjPrereq of classObjToCompare.prerequisites) {
        if (classObj.className === classObjPrereq) {
          classObj.isPrerequisiteFor.push(classObjToCompare.className);
        }
      }
    }
  }
  return classInfoArray;
}

