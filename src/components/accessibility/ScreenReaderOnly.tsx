interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  className = "sr-only" 
}) => {
  return (
    <span className={className}>
      {children}
    </span>
  );
};

export default ScreenReaderOnly;
