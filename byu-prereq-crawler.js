function outputPrereqList() {
  console.log('FYI: there are lots of GET ERR_FILE_NOT_FOUND errors that will show up in the console. This is normal, as making a get request to BYU websites causes the website to expect BYU images on the server, even though they do not exist here.');
  let classList = document.querySelector("textarea#class-list-input").value;
  classList = parseClassList(classList);
  // console.log('processed class list: ', classList);

  // TODO: add loading bar.
  // .map returns a new array that is the result of doing something to every item
  // in the array it is called on. So in this case, I'll get an array of promises
  // that the browser will getPrerequistesForClass (one promise per item)
  let classInfoArray = [];
  let requests = classList.map(className => {
    return new Promise(resolve  => {
      getPrerequisitesForClass(className, prereqList => {
        classInfoArray.push({
          className: className,
          prerequisites: prereqList
        });
        console.log('success processing \'' + className +'\'.');
        resolve('success processing \'' + className +'\'.');
      });
    });
  });

  // TODO: URGENT: TODO: this is the next step
  // I think this doesn't succeed because some of the promises fail.... find a way to do something
  // with existing results
  Promise.all(requests).then(() => {
    console.log('done getting class prereq info! Here\'s what we found:', classInfoArray);
  });

  // let classInfoArray = [];
  // for(className of classList){
  //   getPrerequisitesForClass(className, prereqList => {
  //     // TODO: add loading bar.

  //     classInfoArray.push({
  //       className: className,
  //       prerequisites: prereqList
  //     });
  //     console.log('classInfoArray after processing ' + className, classInfoArray);
  //   });
  // }
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
  for (var i = 0; i < inputStringArray.length;){
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

// callback will be given an array of strings containing the prerequisites for the 
// given class.
function getPrerequisitesForClass(className, callback){
  // TODO: use promises here?? See the link below:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  getClassSearchResultPage(className, classSearchResultPage => {
    parseClassPageFromSearchResultPage(className, classSearchResultPage, classPage => {
      parseClassPrerequisitesFromClassPage(className, classPage, callback);
    });
  });
}

function createHtmlDocFromString(htmlDocString){
  var htmlDoc = document.createElement( 'html' );
  htmlDoc.innerHTML = htmlDocString;
  return htmlDoc;
}

function parseClassPrerequisitesFromClassPage(className, htmlDocString, callback){
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
      error('we couldn\'t find prerequisite data for the class \'' + className + '\'.');
    }
  }
  let prerequisiteLinks = prerequisiteDataRow.querySelectorAll('a');
  let prerequisites = [];
  for(prerequisiteLink of prerequisiteLinks){
    prerequisites.push(prerequisiteLink.innerHTML);
  }
  callback(prerequisites);
  // console.log('prerequisites for ' + className + ' are ', prerequisites);
}

function parseClassPageFromSearchResultPage(className, htmlDocString, callback){
  var htmlDoc = createHtmlDocFromString(htmlDocString);
  let linksToResults = htmlDoc.querySelector('ol.search-results').querySelectorAll('a');
  // let searchResults = htmlDoc.querySelectorAll('li.search-result');
  // let firstSearchResult = htmlDoc.querySelector("li.search-result:first-child");
  // console.log("search results", searchResults);

  for(foundLink of linksToResults){
    if(foundLink.innerHTML.match(new RegExp(className, 'i'))){
      // console.log('found it! ', foundLink);
      // console.log('found href: ', foundLink.getAttribute('href'));
      httpGetWebpageAsyncWithProxy(foundLink.getAttribute('href'), response => {
        callback(response);
        // parseClassPrerequisitesFromClassPage(className, response, callback);
      });
      return;
    }
  }
  error('we couldn\'t find the class \'' + className + '\'. Ensure that it\'s the exact name of the class in the byu catalog and try again!');
}

// this function is the first in a chain that will eventually get the prerequisites
// for a given class
function getClassSearchResultPage(className, callback){
  let classNameForSearch = className.replace(/ /g, '+');
  httpGetWebpageAsyncWithProxy('https://catalog.byu.edu/search/site/' + classNameForSearch,
    response => {
      // parseClassPageFromSearchResultPage(className, response, callback);
      callback(response);
    });
  // inputStringArray[i] = inputStringArray[i].replace(/ /g, '+');
}

function httpGetWebpageAsyncWithProxy(pageUrl, callback){
  // TODO: make custom proxy so I don't rely on someone else's
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.onload = () => {
    // console.log('success! ', xmlHttp.responseText);
    callback(xmlHttp.responseText);
  };
  xmlHttp.onerror = () => {
    console.log('error: ', xmlHttp);
    error('There was a problem retrieving ' + pageUrl + '. Make sure you\'re connected to the internet and that the website we\'re trying to retrieve is available. You can also hit Ctrl-Shift-I (Cmd-Opt-I on mac) and check the console for more info.');
  };
  xmlHttp.open("GET", proxyUrl + pageUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

