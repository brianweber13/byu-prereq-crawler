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
    this.prerequisistes = prerequisites;
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
  // console.log('processed class list: ', classList);

  // TODO: add loading bar.

  // // .map returns a new array that is the result of doing something to every
  // // item in the array it is called on. So in this case, I'll get an array
  // // of promises that the browser will getPrerequistesForClass (one promise 
  // per item)
  // let classInfoArray = [];
  // let requests = classList.map(className => {
  //   return new Promise((resolve, reject)  => {
  //     getPrerequisitesForClass(className, prereqList => {
  //       classInfoArray.push({
  //         className: className,
  //         prerequisites: prereqList
  //       });
  //       console.log('success processing \'' + className +'\'.');
  //       resolve('success processing \'' + className +'\'.');
  //     }, (reason) => {
  //       reject(reason);
  //     });
  //   });
  // });
  //
  // // The problem with this approach is that I want the class info to be
  // // processed even when some async functions fail....
  // Promise.all(requests).then((successValue) => {
  //   console.log('all promises completed: ', successValue);
  //   console.log('Here\'s the class prereq info we found:', classInfoArray);
  // },
  // (reason) => {
  //   // TODO: alert user that we'll try our best but couldn't find all needed 
  //   // info
  //   console.log('some promises failed: ', reason);
  //   console.log('Here\'s the class prereq info we found:', classInfoArray);
  // });

  // classInfoArray is an array of objects of this format:
  // {
  //   className: string, name of class short code
  //   prerequistes: list of classes required to be taken before this
  //     class can be taken (the classes that "lock" this class)
  //   isPrerequisiteFor: list of classes that this class "unlocks": classes
  //     that require this class as a prerequisite.
  // }
  let classInfoArray = [];
  getClassPrereqsAsyncFailureCount = 0;
  for (className of classList) {
    // console.log('className: ', className);
    let localClassName = className;
    // console.log('localClassName: ', localClassName);
    getPrerequisitesForClass(localClassName, (prereqList) => {
      // console.log('localClassName inside async: ', localClassName);
      // TODO: add loading bar.

      classInfoArray.push(new ByuClassInfo(localClassName, prereqList, []));
      // console.log('classInfoArray after processing ' + localClassName,
      //   classInfoArray);
      if (classInfoArray.length === classList.length -
        getClassPrereqsAsyncFailureCount) {
        // DONE! Processed everything we can.
        if (getClassPrereqsAsyncFailureCount !== 0) {
          error('failed to process ' + getClassPrereqsAsyncFailureCount +
            ' classes. Generating results for the classes we successfully ' +
            'got information for.');
        }

        // console.log('before adding \'isPrerequisiteFor\':', classInfoArray);
        classInfoArray =
          addIsPrerequisiteForPropertyToClassObjects(classInfoArray);
        // console.log('after adding \'isPrerequisiteFor\':', classInfoArray);
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
      });
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

// TODO: convert async funtions to use promises instead. This might be helpful: 
// https://softwareengineering.stackexchange.com/questions/302455/is-there-really-a-fundamental-difference-between-callbacks-and-promises
/**
 * @param {string} className - short name of class as determined by BYU
 *   (for example, EC EN 220)
 * @param {foundPrereqCallback} successCallback - will be given an array
 *   of strings, where each string is a prereq.
 * @param {failureCallback} failureCallback
 */
function getPrerequisitesForClass(className, successCallback, failureCallback) {
  // TODO: use promises here?? See the link below:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
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
  // console.log('class page we found: ', htmlDocString);
  let htmlDoc = createHtmlDocFromString(htmlDocString);
  let courseData = htmlDoc.querySelectorAll('tr.course-data-row');
  let prerequisiteDataRow;
  // for(courseDataRow of courseData){
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
  // console.log('prerequisites for ' + className + ' are ', prerequisites);
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
  // let searchResults = htmlDoc.querySelectorAll('li.search-result');
  // let firstSearchResult = htmlDoc
  //   .querySelector("li.search-result:first-child");
  // console.log("search results", searchResults);

  for (foundLink of linksToResults) {
    if (foundLink.innerHTML.match(new RegExp(className, 'i'))) {
      // console.log('found it! ', foundLink);
      // console.log('found href: ', foundLink.getAttribute('href'));
      httpGetWebpageAsyncWithProxy(foundLink.getAttribute('href'),
        (response) => {
          successCallback(response);
          // parseClassPrerequisitesFromClassPage(className, response,
          // callback);
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
      // parseClassPageFromSearchResultPage(className, response, callback);
      successCallback(response);
    }, failureCallback);
  // inputStringArray[i] = inputStringArray[i].replace(/ /g, '+');
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
    // console.log('success! ', xmlHttp.responseText);
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

function buildPrerequisiteTable(prereqArray) {
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
  console.log('in addIsPrerequisiteForPropertyToClassObjects');
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

