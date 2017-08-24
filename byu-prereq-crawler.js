function outputPrereqList() {
  let classList = document.querySelector("textarea#class-list-input").value;
  classList = parseClassList(classList);
  console.log('processed class list: ', classList);

  let classInfoArray = [];
  for(className of classList){
  }
}

function error(errorMessage) {
  let errorOutputContainer = document.querySelector('div#error-output-container').innerHTML; 
  let date = new Date();
  let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  document.querySelector('div#error-output-container').innerHTML = 
    ('<p>' + time + ' ' + errorMessage + '</p>') + errorOutputContainer;
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

function createHtmlDocFromString(htmlDocString){
  var htmlDoc = document.createElement( 'html' );
  htmlDoc.innerHTML = htmlDocString;
  return htmlDoc;
}

function parseClassInfoFromClassPage(htmlDocString){
  console.log('class page we found: ', htmlDocString);
}

function parseClassPageFromSearchResultPage(className, htmlDocString){
  var htmlDoc = createHtmlDocFromString(htmlDocString);
  let linksToResults = htmlDoc.querySelector('ol.search-results').querySelectorAll('a');
  // let searchResults = htmlDoc.querySelectorAll('li.search-result');
  // let firstSearchResult = htmlDoc.querySelector("li.search-result:first-child");
  // console.log("search results", searchResults);

  for(foundLink of linksToResults){
    if(foundLink.innerHTML.match(new RegExp(className, 'i'))){
      console.log('found it! ', foundLink);
      console.log('found href: ', foundLink.getAttribute('href'));
      httpGetWebpageAsyncWithProxy(foundLink.getAttribute('href'), response => {
        parseClassInfoFromClassPage(response);
      });
      return;
    }
  }
  // TODO: make prettier.
  alert('we couldn\'t find the class \'' + className + '\'. Ensure that it\'s the exact name of the class in the byu catalog and try again!');
}

function getClassSearchResultPage(className){
  let classNameForSearch = className.replace(/ /g, '+');
  httpGetWebpageAsyncWithProxy('https://catalog.byu.edu/search/site/' + classNameForSearch, response => {
    parseClassPageFromSearchResultPage(className, response);
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
    // TODO: alert user
    console.log('error: ', xmlHttp);
    alert('There was a problem retrieving ' + pageUrl + '. Make sure you\'re connected to the internet and that the website we\'re trying to retrieve is available. You can also hit Ctrl-Shift-I (Cmd-Opt-I on mac) and check the console for more info.');
  };
  xmlHttp.open("GET", proxyUrl + pageUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

