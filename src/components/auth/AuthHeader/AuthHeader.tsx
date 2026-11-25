/**
 * AuthHeader - Header for authentication pages
 */
import { Link } from 'react-router-dom';
import './AuthHeader.css';

export default function AuthHeader() {
  return (
    <div className="auth-header">
      <Link to="/" className="auth-header-logo">
        <img src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-icon-reversed.svg`} alt="" className="auth-logo-icon" />
        <span className="auth-logo-text">SortLeaf</span>
      </Link>
    </div>
  );
}
