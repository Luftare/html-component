(function() {
const pageName = window.location.pathname.split('/').pop().split('.html').join('') || 'index'; 
const contentFileName = `${pageName}.json`;
const tagName = 'component';
const componentsPath = 'components';
const contentPath = 'content';
const fileNameAttributeName = 'src';
const componentRegexQuery = /<\/component>|<component(.*?)>/g;
const replacements = [
  ['$src', 'src'],
  [/<\/component>|<component(.*?)>/g, '']
];

let pendingFetches = 0;
  
const applyReplacements = str => {
  return replacements.reduce((html, replacement) => html.replace(replacement[0], replacement[1]), str);
};

const handleErrors = res => {
  !res.ok && console.log(res.statusText)
  return res;
};

const setupDependencies = () => {
  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.11/handlebars.min.js');
  document.head.appendChild(scriptElement);
  scriptElement.onload = composeHtml;
};
  
const populateContent = () => {
  const source = document.body.innerHTML;
  const filteredSource = applyReplacements(source);
  const template = Handlebars.compile(filteredSource);
  fetch(`${contentPath}/${contentFileName}`)
      .then(handleErrors)
      .then(data => data.json())
      .then(content => {
        const html = template(content);
        document.body.innerHTML = html;
      })
};
  
const composeHtml = () => {
  const query = `${tagName}[${fileNameAttributeName}]`;
  const elements = document.querySelectorAll(query);
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const componentFileName = element.getAttribute(fileNameAttributeName);
    element.removeAttribute(fileNameAttributeName);
    pendingFetches++;
    fetch(`${componentsPath}/${componentFileName}`)
      .then(data => data.text())
      .then(component => {
        pendingFetches--;
        element.innerHTML = component;
        composeHtml();
      });
  }
  if(pendingFetches === 0) populateContent();
};

setupDependencies();
})();