import bearImg from '../assets/teddy_bear.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <a href="/" className="footer-logo">
          <img src={bearImg} alt="Olivka Bear Logo" className="logo-bear-footer" />
          olivka_store
        </a>
        <p style={{marginBottom: '1.5rem'}}>
          З любов'ю для найменших ✨
        </p>
        <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem'}}>
          <a href="https://www.instagram.com/store.olivka?igsh=cmZpdWp2dXQ2a2F4" target="_blank" rel="noreferrer" style={{color: 'var(--color-stone-400)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span>Instagram</span>
          </a>
        </div>
        <p style={{fontSize: '0.75rem', color: 'var(--color-stone-500)'}}>
          © {new Date().getFullYear()} olivka_store. Всі права захищені.
        </p>
      </div>
    </footer>
  );
}
