import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function Solid({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const RupeeIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.3} {...p}>
    <path d="M6.5 4.5h11M6.5 9.5h11M6.5 4.5h3.8a4.5 4.5 0 0 1 0 9H6.5l8 6.5" />
  </Stroke>
);

export const BellIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </Stroke>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m6 9 6 6 6-6" />
  </Stroke>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m9 6 6 6-6 6" />
  </Stroke>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </Stroke>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M19 12H5m6-6-6 6 6 6" />
  </Stroke>
);

export const UsersIcon = (p: IconProps) => (
  <Solid {...p}>
    <circle cx="9" cy="8" r="3.6" />
    <path d="M2 19.5c0-3.6 3.1-6 7-6s7 2.4 7 6c0 .8-.6 1.5-1.5 1.5h-11C2.6 21 2 20.3 2 19.5z" />
    <path d="M16.2 4.6a3.6 3.6 0 0 1 0 6.8 3.6 3.6 0 0 0 0-6.8z" />
    <path d="M17.3 13.9c2.8.5 4.7 2.4 4.7 5.1 0 1.1-.7 2-1.8 2H18c.4-.5.6-1.2.6-2 0-1.9-.5-3.8-1.3-5.1z" />
  </Solid>
);

export const HomeIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 3.2 2.6 11.4c-.6.5-.2 1.6.6 1.6H5v6.5c0 .8.7 1.5 1.5 1.5H9.5v-6h5v6h3c.8 0 1.5-.7 1.5-1.5V13h1.8c.8 0 1.2-1.1.6-1.6z" />
  </Solid>
);

export const PlaneIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M21.5 15.8v-1.9L13.7 9V4.3a1.7 1.7 0 0 0-3.4 0V9L2.5 13.9v1.9l7.8-2.4v4.2L8.6 19v1.7l3.4-.9 3.4.9V19l-1.7-1.4v-4.2z" />
  </Solid>
);

export const UtensilsIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M6.2 2.5a.9.9 0 0 1 .9.9v6.2h.9V3.4a.9.9 0 0 1 1.8 0v6.2c0 1.6-1 2.9-2.4 3.3L8 20.6a1.3 1.3 0 0 1-2.6 0l.5-7.7C4.500 12.500 3.500 11.200 3.500 9.600V3.400a.9.9 0 0 1 1.800 0v6.200h.9V3.400a.9.9 0 0 1 .9-.9zM17 2.5c.6 0 1 .4 1 1v17a1.300 1.300 0 0 1-2.600 0V14h-1.700c-.5 0-.9-.4-.9-.9C13.800 7.300 15 2.500 17 2.500z" />
  </Solid>
);

export const CartIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M2.5 3.5h2.2c.5 0 .9.3 1 .8l.3 1.200h13.700c.7 0 1.200.7 1 1.400l-1.600 6.100c-.2.600-.7 1-1.300 1H8.700l.3 1.300h9.300a1 1 0 1 1 0 2H8.200c-.5 0-.9-.3-1-.8L4 5.500H2.500a1 1 0 0 1 0-2z" />
    <circle cx="9.500" cy="20" r="1.500" />
    <circle cx="17" cy="20" r="1.500" />
  </Solid>
);

export const BusIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M6 2.5h12A2.500 2.500 0 0 1 20.500 5v11a2 2 0 0 1-1 1.700V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1.500h-7V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2.300a2 2 0 0 1-1-1.700V5A2.500 2.500 0 0 1 6 2.500zM5.500 6.500v4.500h13V6.500zM8 13.500a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400zm8 0a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z" />
  </Solid>
);

export const BedIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M3 5a1 1 0 0 1 2 0v8h14v-1.500A3.500 3.500 0 0 0 15.500 8H10v5H7V8.500A2.500 2.500 0 0 0 4.500 6 .5.5 0 0 1 3 5.500zM3 14.500h18V19a1 1 0 0 1-2 0v-2H5v2a1 1 0 0 1-2 0z" />
  </Solid>
);

export const ReceiptIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6" />
  </Stroke>
);

export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Stroke>
);

export const PlusIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const SwapIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M16 4l4 4-4 4M20 8H5M8 20l-4-4 4-4M4 16h15" />
  </Stroke>
);

export const LockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="5" y="11" width="14" height="9.500" rx="2" />
    <path d="M8.500 11V8a3.500 3.500 0 0 1 7 0v3" />
  </Stroke>
);

export const EyeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2 12s3.500-6.500 10-6.500S22 12 22 12s-3.500 6.500-10 6.500S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.500" />
  </Stroke>
);

export const EyeOffIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2 12s3.500-6.500 10-6.500c1.600 0 3 .4 4.200 1M22 12s-3.500 6.500-10 6.500c-1.600 0-3-.4-4.200-1" />
    <path d="M9.500 9.700a2.500 2.500 0 0 0 3.300 3.400M4 4l16 16" />
  </Stroke>
);

export const LogOutIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M10 4H5.500A1.500 1.500 0 0 0 4 5.500v13A1.500 1.500 0 0 0 5.500 20H10" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </Stroke>
);

export const UserIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.500 20a7.500 7.500 0 0 1 15 0" />
  </Stroke>
);

export const MailIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="5.500" width="18" height="13" rx="2" />
    <path d="m3.500 7 8.500 6 8.500-6" />
  </Stroke>
);

export const CalendarIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="4" y="5.500" width="16" height="14.500" rx="2" />
    <path d="M4 10h16M8 3.500v4M16 3.500v4" />
  </Stroke>
);

export const CrownIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M3 8l4.500 4L12 5l4.500 7L21 8l-1.800 10.500a1 1 0 0 1-1 .8H5.800a1 1 0 0 1-1-.8z" />
  </Solid>
);

export const CheckIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="m5 12.500 4.500 4.500L19 7.500" />
  </Stroke>
);

export const CloseIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Stroke>
);

export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 7h16M10 3.5h4M6 7l.8 12.2a1.5 1.5 0 0 0 1.500 1.300h7.400a1.500 1.500 0 0 0 1.500-1.300L18 7M10 11v6M14 11v6" />
  </Stroke>
);

export const SettingsIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="7.5" />
    <path d="M19.5 12H22M4.5 12H2M12 19.5V22M12 4.5V2M17.3 17.3l1.8 1.8M6.7 17.3l-1.8 1.8M6.7 6.7 4.9 4.9M17.3 6.7l1.8-1.8" />
  </Stroke>
);

export const PencilIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 20h4L19 9a2.100 2.100 0 0 0-3-3L5 17z M14.500 7.500l3 3" />
  </Stroke>
);

export const MoreVerticalIcon = (p: IconProps) => (
  <Solid {...p}>
    <circle cx="12" cy="5" r="1.800" />
    <circle cx="12" cy="12" r="1.800" />
    <circle cx="12" cy="19" r="1.800" />
  </Solid>
);

export const ShieldIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6z" />
    <path d="m9 12 2.200 2.200L15.500 10" />
  </Stroke>
);
