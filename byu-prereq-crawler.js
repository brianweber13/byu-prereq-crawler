let getClassPrereqsAsyncFailureCount = 0;

function outputPrereqList() {
  console.log('FYI: there are lots of GET ERR_FILE_NOT_FOUND errors that ' +
    'will show up in the console. This is normal, as making a get request ' +
    'to BYU websites causes the website to expect BYU images on the server, ' +
    'even though they do not exist here.');
  info('Beginning to process classes....');
  let classList = document.querySelector("textarea#class-list-input").value;
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

      classInfoArray.push({
        className: localClassName,
        prerequisites: prereqList,
        isPrerequisiteFor: []
      });
      // console.log('classInfoArray after processing ' + localClassName,
      //   classInfoArray);
      if(classInfoArray.length === classList.length - getClassPrereqsAsyncFailureCount){
        // DONE! Processed everything we can.
        if(getClassPrereqsAsyncFailureCount !== 0){
          error('failed to process ' + getClassPrereqsAsyncFailureCount +
            ' classes. Generating results for the classes we successfully ' +
            'got information for.');
        }

        // console.log('before adding \'isPrerequisiteFor\':', classInfoArray);
        classInfoArray = addIsPrerequisiteForPropertyToClassObjects(classInfoArray);
        // console.log('after adding \'isPrerequisiteFor\':', classInfoArray);
      }
    },
    // TODO: it'd probably be good to move all the error reports to this
    // part. That way the other functions will be more modular, and the
    // medium of the error handling can be input the callback
    failureReason => {
      // TODO: 
      // error(failureReason);
      getClassPrereqsAsyncFailureCount++;
    });
  }
}

function error(errorMessage) {
  alertOnPage(errorMessage, 'error-output-text');
}

function info(infoMessage) {
  alertOnPage(infoMessage, 'info-output-text');
}

function alertOnPage(message, htmlClass){
  let errorOutputContainer = document.querySelector('div#error-output-container').innerHTML;
  let date = new Date();
  let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  document.querySelector('div#error-output-container').innerHTML =
    ('<p class=' + htmlClass + '>' + time + ' ' + message + '</p>') + errorOutputContainer;
}

function parseClassList(inputString) {
  var inputString = inputString.replace(/\r\n/g, '\n');
  var inputString = inputString.replace(/\r/g, '\n');
  inputStringArray = inputString.split('\n');
  for (let i = 0; i < inputStringArray.length;){
    if(inputStringArray[i].charAt(0) === '#'){
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
// successCallback will be given an array of strings containing the prerequisites for the 
// given class.
function getPrerequisitesForClass(className, successCallback, failureCallback){
  // TODO: use promises here?? See the link below:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  getClassSearchResultPage(className, (classSearchResultPage) => {
    parseClassPageFromSearchResultPage(className, classSearchResultPage, (classPage) => {
      parseClassPrerequisitesFromClassPage(className, classPage, successCallback, failureCallback);
    }, failureCallback);
  }, failureCallback);
}

function createHtmlDocFromString(htmlDocString){
  var htmlDoc = document.createElement( 'html' );
  htmlDoc.innerHTML = htmlDocString;
  return htmlDoc;
}

function parseClassPrerequisitesFromClassPage(className, htmlDocString, successCallback, failureCallback){
  // console.log('class page we found: ', htmlDocString);
  var htmlDoc = createHtmlDocFromString(htmlDocString);
  let courseData = htmlDoc.querySelectorAll('tr.course-data-row');
  let prerequisiteDataRow;
  // for(courseDataRow of courseData){
  for(let i = 0; i < courseData.length; i++){
    if(courseData[i].innerHTML.match(/.*prerequisites.*/i)){
      prerequisiteDataRow = courseData[i];
      break;
    }
    if ( i === courseData.length ){
      errorMessage = 'we couldn\'t find prerequisite data for the class \'' + className + '\'.';
      error(errorMessage);
      failureCallback(errorMessage);
    }
  }
  let prerequisiteLinks = prerequisiteDataRow.querySelectorAll('a');
  let prerequisites = [];
  for(prerequisiteLink of prerequisiteLinks){
    prerequisites.push(prerequisiteLink.innerHTML);
  }
  successCallback(prerequisites);
  // console.log('prerequisites for ' + className + ' are ', prerequisites);
}

function parseClassPageFromSearchResultPage(className, htmlDocString, successCallback, failureCallback){
  var htmlDoc = createHtmlDocFromString(htmlDocString);
  let linksToResults = htmlDoc.querySelector('ol.search-results').querySelectorAll('a');
  // let searchResults = htmlDoc.querySelectorAll('li.search-result');
  // let firstSearchResult = htmlDoc.querySelector("li.search-result:first-child");
  // console.log("search results", searchResults);

  for(foundLink of linksToResults){
    if(foundLink.innerHTML.match(new RegExp(className, 'i'))){
      // console.log('found it! ', foundLink);
      // console.log('found href: ', foundLink.getAttribute('href'));
      httpGetWebpageAsyncWithProxy(foundLink.getAttribute('href'), (response) => {
        successCallback(response);
        // parseClassPrerequisitesFromClassPage(className, response, callback);
      });
      return;
    }
  }
  errorMessage = 'we couldn\'t find the class \'' + className + '\'. Ensure that it\'s the exact name of the class in the byu catalog and try again!';
  error(errorMessage);
  failureCallback(errorMessage);
}

// this function is the first in a chain that will eventually get the prerequisites
// for a given class
function getClassSearchResultPage(className, successCallback, failureCallback) {
  let classNameForSearch = className.replace(/ /g, '+');
  httpGetWebpageAsyncWithProxy('https://catalog.byu.edu/search/site/' + classNameForSearch,
    response => {
      // parseClassPageFromSearchResultPage(className, response, callback);
      successCallback(response);
    }, failureCallback);
  // inputStringArray[i] = inputStringArray[i].replace(/ /g, '+');
}

function httpGetWebpageAsyncWithProxy(pageUrl, successCallback, failureCallback) {
  // TODO: make custom proxy so I don't rely on someone else's
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  let xmlHttp = new XMLHttpRequest();

  xmlHttp.onload = () => {
    // console.log('success! ', xmlHttp.responseText);
    successCallback(xmlHttp.responseText);
  };
  xmlHttp.onerror = () => {
    console.log('error: ', xmlHttp);
    errorMessage = 'There was a problem retrieving ' + pageUrl + '. Make sure you\'re connected to the internet and that the website we\'re trying to retrieve is available. You can also hit Ctrl-Shift-I (Cmd-Opt-I on mac) and check the console for more info.';
    error(errorMessage);
    failureCallback(errorMessage);
  };
  xmlHttp.open('GET', proxyUrl + pageUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

function buildPrerequisiteTable(prereqArray){
}

function addIsPrerequisiteForPropertyToClassObjects(classInfoArray){
  console.log('in addIsPrerequisiteForPropertyToClassObjects');
  for(classObj of classInfoArray){
    for(classObjToCompare of classInfoArray){
      for(classObjPrereq of classObjToCompare.prerequisites){
        if(classObj.className === classObjPrereq){
          classObj.isPrerequisiteFor.push(classObjToCompare.className);
        }
      }
    }
  }
  return classInfoArray;
}

