/*TODO: 
Request both components (templates) and texts simultaneously
once no components are unloaded and texts are loaded --> populate texts

*/
(function() {
const pageName = window.location.pathname.split('/').pop().split('.html').join(''); 
const contentPath = 'content';
const contentFileName = `${pageName}.json`;

const setupDependencies = () => {
  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.11/handlebars.min.js');
  document.head.appendChild(scriptElement);
  scriptElement.onload = composeHtml;
};
  
const populateContent = () => {
  const regexQuery = /<\/block>|<block(.*?)>/g;
  const source = document.body.innerHTML;
  const filteredSource = source.replace(regexQuery, () => '');
  const template = Handlebars.compile(filteredSource);
  fetch(`${contentPath}/${contentFileName}`)
      .then(data => data.json())
      .then(content => {
        const html = template(content);
        document.body.innerHTML = html;
      })
      .catch(err => console.log(err))
}
  
let pendingFetches = 0;
  
const composeHtml = () => {
  const fileNameAttributeName = 'src';
  const tagName = 'block';
  const componentsPath = 'components';
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