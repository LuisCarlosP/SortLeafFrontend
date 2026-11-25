/**
 * AuthHeader - Header for authentication pages
 */
import { Link } from 'react-router-dom';
import sortleafIconWhite from '../../../assets/sortleaf-icon-white.svg';
import './AuthHeader.css';

export default function AuthHeader() {
  return (
    <div className="auth-header">
      <Link to="/" className="auth-header-logo">
        <img src={sortleafIconWhite} alt="SortLeaf" className="auth-logo-icon" />
        <span className="auth-logo-text">SortLeaf</span>
      </Link>
    </div>
  );
}
