'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface NavigationButtonsProps {
	onPrevious?: () => void;
	onNext?: () => void;
	showPrevious?: boolean;
	showNext?: boolean;
	previousLabel?: string;
	nextLabel?: string;
	previousDisabled?: boolean;
	nextDisabled?: boolean;
	className?: string;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
	onPrevious,
	onNext,
	showPrevious = true,
	showNext = true,
	previousLabel = 'Previous',
	nextLabel = 'Next Step',
	previousDisabled = false,
	nextDisabled = false,
	className,
}) => {
	return (
		<div className={cn('flex items-center justify-between border-t border-border-color/30 pt-6', className)}>
			{showPrevious ? (
				<button
					type="button"
					onClick={onPrevious}
					disabled={previousDisabled}
					className={cn(
						'flex items-center gap-2 h-12 rounded-xl px-5 text-sm font-semibold text-text-subtle',
						'bg-border-color/40 hover:bg-border-color/70 hover:text-text-main',
						'active:scale-95 transition-all',
						'disabled:cursor-not-allowed disabled:opacity-40'
					)}
				>
					<ArrowLeft className="h-4 w-4" />
					{previousLabel}
				</button>
			) : (
				<div />
			)}
			{showNext && (
				<button
					type="button"
					onClick={onNext}
					disabled={nextDisabled}
					className={cn(
						'flex items-center gap-2 h-12 rounded-xl px-6 text-sm font-semibold text-white',
						'bg-primary hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20',
						'active:scale-95 transition-all',
						'disabled:cursor-not-allowed disabled:opacity-40'
					)}
				>
					{nextLabel}
					<ArrowRight className="h-4 w-4" />
				</button>
			)}
		</div>
	);
};

NavigationButtons.displayName = 'NavigationButtons';
