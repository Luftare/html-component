(function() {
const BODY_DISPLAY_STYLE = 'block';
const pageName = window.location.pathname.split('/').pop().split('.html').join('') || 'index'; 
const contentFileName = `${pageName}.json`;
const tagName = 'component';
const componentsPath = 'components';
const contentPath = 'content';
const fileNameAttributeName = 'src';
const componentRegexQuery = /<\/component>|<component(.*?)>/g;
const replacements = [
  ['$src', 'src'],
  [/<\/component>|<component(.*?)>/g, ''],
  ['[#children]', ''],
  ['&lt;', '<'],
  ['&gt;', '>']
];

let pendingFetches = 0;
  
const cachedFetch = (url) => {
  return fetch(url);
};
  
const hydrateScripts = () => {
  const scriptTags = document.querySelectorAll('script');
  for(let i = 0; i < scriptTags.length; i++) {
    const inactiveScriptNode = scriptTags[i];
    if(inactiveScriptNode.text.length > 0) {
      const scriptNode = document.createElement('script');
      scriptNode.text = inactiveScriptNode.innerHTML;
      inactiveScriptNode.parentNode.removeChild(inactiveScriptNode);
      document.body.appendChild(scriptNode);
    }
  }
};
  
const boot = () => {
  hideBody();
  setupDependencies();
};
  
const requestOnReady = () => {
  const allComponentsPopulated = !document.querySelector('component');
  if(allComponentsPopulated) {
    onReady();
  } else {
    composeHtml();    
  }
};
  
const onReady = () => {
  showBody();
  hydrateScripts();
}; 

const hideBody = () => {
  document.body.style.display = 'none';
};
  
const showBody = () => {
  document.body.style.removeProperty('display');
}

const applyReplacements = str => {
  return replacements.reduce((html, replacement) => html.split(replacement[0]).join(replacement[1]), str);
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
  cachedFetch(`${contentPath}/${contentFileName}`)
      .then(handleErrors)
      .then(data => data.json())
      .then(content => {
        const html = template(content);
        document.body.innerHTML = html;
        requestOnReady();
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
    cachedFetch(`${componentsPath}/${componentFileName}`)
      .then(data => data.text())
      .then(component => {
        pendingFetches--;
        const hasNestedElements = element.innerHTML.length > 0;
        const templateHasArea = component.includes('[#children]');
        if(hasNestedElements && templateHasArea) {
          const index = component.indexOf('[#children]');
          const start = component.substring(0, index);
          const end = component.substring(index, component.length); 
          element.prepend(start);
          element.append(end);
        } else {
          element.innerHTML = component;
        }
        composeHtml();
      });
  }
  if(pendingFetches === 0) populateContent();
};
  
boot();
})();