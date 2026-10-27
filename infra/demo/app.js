import { EDITIONS, resolveModules, PRESENCE, EFFORT_CLASSES } from './core/index.js';
async function initialize() {
  const [profiles, language, data] = await Promise.all(['editions.json', 'language.it.json', '/api/demo/v1/foundation'].map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw Error('Le definizioni della demo non sono disponibili.');
    return response.json();
  }));
  const select = document.querySelector('#edition');
  for (const name of Object.keys(EDITIONS)) select.add(new Option(profiles.profiles[name].label, name));
  function render() {
    document.querySelector('#purpose').textContent = profiles.profiles[select.value].task;
    document.querySelector('#modules').replaceChildren(...resolveModules(EDITIONS[select.value]).map(id => {
      const li = document.createElement('li'); li.textContent = language.modules[id]; return li;
    }));
  }
  select.addEventListener('change', render); render();
  const theme = document.querySelector('#theme');
  theme.setAttribute('aria-pressed', String(getComputedStyle(document.documentElement).colorScheme === 'dark'));
  theme.addEventListener('click', event => {
    const dark = getComputedStyle(document.documentElement).colorScheme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    event.currentTarget.setAttribute('aria-pressed', String(dark));
  });
  const pairs = [
    ['Esito', PRESENCE.find(([code]) => code === data.observation.presence)?.[1] || language.format.missing],
    ['Durata', EFFORT_CLASSES.find(([code]) => code === data.observation.effortClass)?.[1] || language.format.missing],
    ['Identificazione', data.observation.identification === 'unreviewed' ? language.vocabulary.unreviewed : language.format.missing],
  ];
  document.querySelector('#observation').replaceChildren(...pairs.flatMap(([label, value]) => {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd];
  }));
  document.querySelector('#status').textContent = language.messages.demo;
}
initialize().catch(error => { document.querySelector('#status').textContent = error.message; });
