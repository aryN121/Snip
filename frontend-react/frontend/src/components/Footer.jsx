export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="footer-logo">
            <span className="logo-dot"></span>SNIP
          </div>
          <span className="footer-copyright">
            &copy; {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
        
        <div className="footer-right">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
}