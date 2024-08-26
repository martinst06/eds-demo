import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isNotMobile = window.matchMedia('(width >= 770px)');

function toggleNavSection(navDrop, expanded) {
  const navControlButton = navDrop.querySelector(':scope > button');
  navControlButton.setAttribute('aria-expanded', expanded);
}

function toggleAllNavSections(navSectionContainer, expanded = false) {
  navSectionContainer.querySelectorAll('li.collapsible').forEach((navSection) => {
    toggleNavSection(navSection, expanded);
  });
}

function decorateFooterNav(block, footerNavList) {
  footerNavList.classList.add('nav-list');
  footerNavList.querySelectorAll(':scope > li').forEach((liEl, idx) => {
    const subList = liEl.querySelector(':scope > ul');
    if (subList) {
      liEl.classList.add('collapsible');

      const textNodes = [...liEl.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
      const liText = textNodes.map((text) => text.textContent).join('').trim();
      const dropButton = document.createElement('button');
      const sublistId = `sublist-${toClassName(liText)}-${idx}`;
      dropButton.textContent = liText;
      [
        { attr: 'type', value: 'button' },
        { attr: 'aria-expanded', value: 'false' },
        { attr: 'aria-controls', value: sublistId },
      ].forEach(({ attr, value }) => {
        dropButton.setAttribute(attr, value);
      });

      const collapsibleContent = document.createElement('div');
      collapsibleContent.classList.add('collapsible-content');
      collapsibleContent.append(subList);
      liEl.append(collapsibleContent);

      liEl.prepend(dropButton);
      textNodes.forEach((text) => text.remove());
      subList.setAttribute('id', sublistId);
      subList.classList = 'sublist';
      dropButton.addEventListener('click', () => {
        if (!isNotMobile.matches) {
          const expanded = dropButton.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(block, false);
          toggleNavSection(liEl, !expanded);
        }
      });
    }
  });
} // ^this is all for mobile

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-content';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  footer.querySelectorAll('.section > .default-content-wrapper > ul').forEach((ul) => {
    decorateFooterNav(block, ul);
  });

  isNotMobile.addEventListener('change', () => {
    requestAnimationFrame(() => toggleAllNavSections(block, isNotMobile.matches));
  }); // animationn

  const yearTag = footer.querySelector('.section:last-child p > u');

  if (yearTag && yearTag.textContent === 'YYYY') {
    const currentYear = document.createTextNode(new Date().getFullYear());
    yearTag.replaceWith(currentYear);
  }

  if (footer.querySelectorAll('.section').length < 3) {
    block.add('light-footer');
  }

  block.append(footer);
  toggleAllNavSections(block, isNotMobile.matches);
}
