import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface SelectOption {
	value: string;
	label: string;
}

/**
 * Props for the BuilderSelect component.
 *
 * Note: This component uses `onValueChange` instead of the standard React `onChange`
 * event handler. The `onValueChange` callback is intentionally simplified to receive
 * only the selected value as a string `(value: string) => void`, rather than the full
 * React change event. This design avoids confusion with native select onChange semantics
 * and provides a cleaner API for handling value changes.
 */
export interface BuilderSelectProps
	extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
	id: string;
	label: string;
	options: SelectOption[];
	error?: string;
	onValueChange?: (value: string) => void;
}

export const BuilderSelect = React.forwardRef<
	HTMLSelectElement,
	BuilderSelectProps
>(
	(
		{
			id,
			label,
			value,
			onValueChange,
			options,
			placeholder,
			className,
			name,
			required,
			error,
			...props
		},
		ref
	) => {
		const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
			onValueChange?.(e.target.value);
		};

		return (
			<div className="flex flex-col gap-2">
				{label && (
					<Label htmlFor={id} className="text-base font-medium text-text-main">
						{label}
						{required && <span className="text-red-400 ml-1">*</span>}
					</Label>
				)}
				<div className="relative">
					<select
						ref={ref}
						id={id}
						name={name}
						value={value}
						onChange={handleChange}
						required={required}
						className={cn(
							'form-input h-14 w-full appearance-none rounded-lg border border-border-color bg-white p-[15px] pr-10',
							'text-text-main',
							error && 'border-red-400',
							className
						)}
						{...props}
					>
						{placeholder && (
							<option value="" disabled>
								{placeholder}
							</option>
						)}
						{options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<span className="material-symbols-outlined absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-text-subtle">
						expand_more
					</span>
				</div>
				{error && <p className="text-sm text-red-400">{error}</p>}
			</div>
		);
	}
);

BuilderSelect.displayName = 'BuilderSelect';
