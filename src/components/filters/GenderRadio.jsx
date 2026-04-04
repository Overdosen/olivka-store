import React from 'react';

export default function GenderRadio({ value, onChange }) {
  const options = [
    { id: 'Хлопчик', label: 'Хлопчик', scheme: 'boy' },
    { id: 'Дівчинка', label: 'Дівчинка', scheme: 'girl' },
    { id: 'Унісекс', label: 'Унісекс', scheme: 'unisex' },
  ];

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Base CSS (Reduced size by ~20%, minimal border radius) */
        .radio-inputs {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          border-radius: 0.3rem; /* minimal radius */
          background: #eee6d8;
          box-sizing: border-box;
          box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.05), 1px 1px 5px rgba(0, 0, 0, 0.02);
          padding: 0.4rem;
          width: 100%;
          margin: 0 auto; /* Center in sidebar */
          font-size: 13px;
          gap: 0.4rem;
        }

        .radio-inputs .radio {
          flex: 1 1 auto;
          text-align: center;
          position: relative;
        }

        .radio-inputs .radio input {
          display: none;
        }

        .radio-inputs .radio .name {
          display: flex;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          border-radius: 0.2rem; /* minimal radius */
          border: none;
          padding: 0.5rem 0;
          color: #2d3748;
          font-weight: 500;
          font-family: inherit;
          background: transparent;
          box-shadow: none;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        /* ----- BOY SCHEME (Beige/Brown) ----- */
        .radio-inputs .radio input[data-scheme="boy"]:checked + .name {
          background: linear-gradient(145deg, #a88d77, #8a7360);
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2), inset -2px -2px 5px rgba(255, 255, 255, 0.1), 3px 3px 8px rgba(152, 123, 102, 0.3);
          transform: translateY(2px);
          animation: select 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .radio-inputs .radio input[data-scheme="boy"]:checked + .name::before {
          background: #b59b86; box-shadow: 0 0 6px #b59b86, 10px -10px 0 #b59b86, -10px -10px 0 #b59b86;
          animation: multi-particles-top 0.8s ease-out forwards;
        }
        .radio-inputs .radio input[data-scheme="boy"]:checked + .name::after {
          box-shadow: 0 0 8px #c2a893, 10px 10px 0 #c2a893, -10px 10px 0 #c2a893;
          animation: multi-particles-bottom 0.8s ease-out forwards;
          background: radial-gradient(circle at 50% 50%, rgba(152, 123, 102, 0.3) 0%, transparent 50%);
          animation: sparkle-bg-boy 1s ease-out forwards;
        }
        .radio-inputs .radio input[data-scheme="boy"]:checked + .name::after {
          background: linear-gradient(45deg, rgba(168, 141, 119, 0.5), rgba(138, 115, 96, 0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          animation: border-glow-boy 1.5s ease-in-out infinite alternate;
        }

        /* ----- GIRL SCHEME (Powder Pink) ----- */
        .radio-inputs .radio input[data-scheme="girl"]:checked + .name {
          background: linear-gradient(145deg, #d4a3c1, #b588a3);
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2), inset -2px -2px 5px rgba(255, 255, 255, 0.1), 3px 3px 8px rgba(204, 152, 184, 0.3);
          transform: translateY(2px);
          animation: select 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .radio-inputs .radio input[data-scheme="girl"]:checked + .name::before {
          background: #dfb3cc; box-shadow: 0 0 6px #dfb3cc, 10px -10px 0 #dfb3cc, -10px -10px 0 #dfb3cc;
          animation: multi-particles-top 0.8s ease-out forwards;
        }
        .radio-inputs .radio input[data-scheme="girl"]:checked + .name::after {
          box-shadow: 0 0 8px #ebd1e0, 10px 10px 0 #ebd1e0, -10px 10px 0 #ebd1e0;
          animation: multi-particles-bottom 0.8s ease-out forwards;
          background: radial-gradient(circle at 50% 50%, rgba(204, 152, 184, 0.3) 0%, transparent 50%);
          animation: sparkle-bg-girl 1s ease-out forwards;
        }
        .radio-inputs .radio input[data-scheme="girl"]:checked + .name::after {
          background: linear-gradient(45deg, rgba(212, 163, 193, 0.5), rgba(181, 136, 163, 0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          animation: border-glow-girl 1.5s ease-in-out infinite alternate;
        }

        /* ----- UNISEX SCHEME (Grey) ----- */
        .radio-inputs .radio input[data-scheme="unisex"]:checked + .name {
          background: linear-gradient(145deg, #b0acaf, #918d8f);
          color: #ffffff;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2), inset -2px -2px 5px rgba(255, 255, 255, 0.1), 3px 3px 8px rgba(168, 164, 167, 0.3);
          transform: translateY(2px);
          animation: select 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .radio-inputs .radio input[data-scheme="unisex"]:checked + .name::before {
          background: #bfbbbe; box-shadow: 0 0 6px #bfbbbe, 10px -10px 0 #bfbbbe, -10px -10px 0 #bfbbbe;
          animation: multi-particles-top 0.8s ease-out forwards;
        }
        .radio-inputs .radio input[data-scheme="unisex"]:checked + .name::after {
          box-shadow: 0 0 8px #d6d3d5, 10px 10px 0 #d6d3d5, -10px 10px 0 #d6d3d5;
          animation: multi-particles-bottom 0.8s ease-out forwards;
          background: radial-gradient(circle at 50% 50%, rgba(168, 164, 167, 0.3) 0%, transparent 50%);
          animation: sparkle-bg-unisex 1s ease-out forwards;
        }
        .radio-inputs .radio input[data-scheme="unisex"]:checked + .name::after {
          background: linear-gradient(45deg, rgba(168, 164, 167, 0.6), rgba(145, 141, 143, 0.6));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          animation: border-glow-unisex 1.5s ease-in-out infinite alternate;
        }

        /* Hover effect */
        .radio-inputs .radio:hover .name {
          background: linear-gradient(145deg, #f0f0f0, #ffffff);
          transform: translateY(-1px);
          box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .radio-inputs .radio:hover input:checked + .name {
          transform: translateY(1px);
        }

        /* Particles Base */
        .radio-inputs .radio .name::before,
        .radio-inputs .radio .name::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
        }
        .radio-inputs .radio .name::before {
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
        }
        .radio-inputs .radio .name::after {
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
        }

        /* Ripple effect */
        .radio-inputs .radio .name-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.5) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .radio-inputs .radio input:checked + .name .name-inner::before {
          animation: ripple 0.8s ease-out;
        }

        /* Keyframes */
        @keyframes select {
          0% { transform: scale(0.95) translateY(2px); }
          50% { transform: scale(1.05) translateY(-1px); }
          100% { transform: scale(1) translateY(2px); }
        }
        @keyframes multi-particles-top {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          40% { opacity: 0.8; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0); box-shadow: 0 0 6px transparent, 20px -20px 0 transparent, -20px -20px 0 transparent; }
        }
        @keyframes multi-particles-bottom {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          40% { opacity: 0.8; }
          100% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0); box-shadow: 0 0 8px transparent, 20px 20px 0 transparent, -20px 20px 0 transparent; }
        }
        @keyframes sparkle-bg-boy { 0% { opacity: 0; transform: scale(0.2); } 50% { opacity: 1; } 100% { opacity: 0; transform: scale(2); } }
        @keyframes sparkle-bg-girl { 0% { opacity: 0; transform: scale(0.2); } 50% { opacity: 1; } 100% { opacity: 0; transform: scale(2); } }
        @keyframes sparkle-bg-unisex { 0% { opacity: 0; transform: scale(0.2); } 50% { opacity: 1; } 100% { opacity: 0; transform: scale(2); } }
        
        @keyframes border-glow-boy { 0% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes border-glow-girl { 0% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes border-glow-unisex { 0% { opacity: 0.5; } 100% { opacity: 1; } }
        
        @keyframes ripple {
          0% { opacity: 1; transform: scale(0.2); }
          50% { opacity: 0.5; }
          100% { opacity: 0; transform: scale(2.5); }
        }
      `}} />

      <div className="radio-inputs">
        {options.map((opt) => (
          <label className="radio" key={opt.id}>
            <input 
              type="radio" 
              name="gender" 
              data-scheme={opt.scheme} 
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
            />
            <span className="name">
              <span className="name-inner">{opt.label}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
