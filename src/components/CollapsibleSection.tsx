import { useId, useState, type ReactNode, type Ref } from 'react';

const joinClassNames = (
  ...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(' ');

export interface CollapsibleSectionProps {
  title: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  toggleClassName?: string;
  contentClassName?: string;
  headerContent?: ReactNode;
  sectionRef?: Ref<HTMLElement>;
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
  className,
  headerClassName,
  titleClassName,
  toggleClassName,
  contentClassName,
  headerContent,
  sectionRef,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const contentId = useId();

  const toggleCollapsed = () => {
    setCollapsed((previous) => !previous);
  };

  return (
    <section ref={sectionRef} className={joinClassNames('collapsible', className)}>
      <div className={joinClassNames('collapsible__header', headerClassName)}>
        <button
          type="button"
          className={joinClassNames('collapsible__toggle', toggleClassName)}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          onClick={toggleCollapsed}
        >
          <span className="collapsible__icon" aria-hidden="true">
            {collapsed ? '+' : '−'}
          </span>
          <span className={joinClassNames('collapsible__title', titleClassName)}>
            {title}
          </span>
        </button>
        {headerContent ? (
          <div className="collapsible__header-content">{headerContent}</div>
        ) : null}
      </div>
      <div
        id={contentId}
        className={joinClassNames('collapsible__content', contentClassName)}
        hidden={collapsed}
      >
        {children}
      </div>
    </section>
  );
}
