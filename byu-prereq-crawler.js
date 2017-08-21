function outputPrereqList() {
  let classList = document.querySelector("textarea#class-list-input").value;
  classList = parseClassList(classList);
  console.log('processed class list: ', classList);
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
      inputStringArray[i].trim();
      inputStringArray[i] = inputStringArray[i].replace(/ /g, '+');
      i++;
    }
  }
  return inputStringArray;
}

function getClassInfo(){
}

function getClassPage(){
}

function getClassSearchResultPage(){
}
