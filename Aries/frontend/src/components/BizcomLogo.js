import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function BizcomLogo({ size = 28, style = {} }) {
  return html`
    <img
      src="bizcom.jpg"
      style=${{ height: size, width: "auto", ...style }}
      alt="Bizcom Logo"
      onError=${(e) => { e.target.style.display = 'none'; console.error("Logo failed to load"); }}
    />
  `;
}
