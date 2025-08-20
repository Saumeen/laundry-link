import Image from 'next/image';
import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  src?: string;
}

const Logo: React.FC<LogoProps> = ({
  width = 131,
  height = 35,
  className = '',
  src = '/laundry-link-main.png',
}) => {
  return (
    <Image
      src={src}
      alt='Laundry Link Logo'
      width={width}
      height={height}
      className={className}
    />
  );
};

export default Logo;
