/*TODO: 
Request both components (templates) and texts simultaneously
once no components are unloaded and texts are loaded --> populate texts

*/
(function() {
const populateTemplate = (template, data) => template.replace(/{([^{}]*)}/g, (a, b) =>  data[b]);

const composeHtml = () => {
  const fileNameAttributeName = 'src';
  const tagName = 'block';
  const textAttributeName = 'txt';
  const componentsPath = 'components';
  const textsPath = 'texts';
  const query = `${tagName}[${fileNameAttributeName}]`;
  const elements = document.querySelectorAll(query);

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const componentFileName = element.getAttribute(fileNameAttributeName);
    element.removeAttribute(fileNameAttributeName);
    fetch(`${componentsPath}/${componentFileName}`)
      .then(data => data.text())
      .then(component => {
        const textFileName = element.getAttribute(textAttributeName);
        if(textFileName) {
          fetch(`${textsPath}/${textFileName}`)
            .then(data => data.json())
            .then(texts => {
              const populatedComponent = populateTemplate(component, texts)
              element.innerHTML = populatedComponent;
              composeHtml();
            });
        } else {
          element.innerHTML = component;
          composeHtml();
        }
      });
  }
};

composeHtml();
})();