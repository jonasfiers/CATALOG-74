import './CatAvatar.css'

export default function CatAvatar({ className = '', state = null }) {
  const cls = ['cat-avatar', state && `cat-avatar--${state}`, className].filter(Boolean).join(' ')

  return (
    <svg className={cls} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#F5EDE0"/>
      <g className="cat-body">
        <g className="cat-ear-left">
          <polygon points="10,18 14,8 20,18" fill="#F5A623"/>
          <polygon points="12,17 14,10 18,17" fill="#F07167"/>
        </g>
        <g className="cat-ear-right">
          <polygon points="28,18 34,8 38,18" fill="#F5A623"/>
          <polygon points="30,17 34,10 36,17" fill="#F07167"/>
        </g>
        <circle cx="24" cy="28" r="16" fill="#F5A623"/>
        <g className="cat-eye-group">
          <ellipse cx="19" cy="27" rx="2.5" ry="3" fill="#2C1A0E"/>
          <circle cx="20" cy="26" r="0.9" fill="white"/>
        </g>
        <g className="cat-eye-group">
          <ellipse cx="29" cy="27" rx="2.5" ry="3" fill="#2C1A0E"/>
          <circle cx="30" cy="26" r="0.9" fill="white"/>
        </g>
        <ellipse cx="24" cy="32" rx="1.5" ry="1.1" fill="#F07167"/>
        <line x1="8"  y1="30" x2="19" y2="32" stroke="#2C1A0E" strokeWidth="0.7" opacity="0.4"/>
        <line x1="8"  y1="33" x2="19" y2="33" stroke="#2C1A0E" strokeWidth="0.7" opacity="0.4"/>
        <line x1="29" y1="32" x2="40" y2="30" stroke="#2C1A0E" strokeWidth="0.7" opacity="0.4"/>
        <line x1="29" y1="33" x2="40" y2="33" stroke="#2C1A0E" strokeWidth="0.7" opacity="0.4"/>
      </g>
    </svg>
  )
}
