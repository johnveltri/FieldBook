import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { DropdownBottomSheet, type DropdownBottomSheetOption } from './DropdownBottomSheet';
import { createTextStyles } from '../../theme/nativeTokens';

const typography = createTextStyles({
  serifBold: 'System',
  mono: 'System',
  monoSemi: 'System',
  monoBold: 'System',
});

const unitOptions: DropdownBottomSheetOption[] = [
  { id: 'ea', label: 'ea', value: 'ea' },
  { id: 'ft', label: 'ft', value: 'ft' },
  { id: 'pcs', label: 'pcs', value: 'pcs' },
];

describe('DropdownBottomSheet', () => {
  it('calls onSelect with the tapped preset value', () => {
    const onSelect = jest.fn();
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        currentValue="ea"
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByLabelText('ft'));
    expect(onSelect).toHaveBeenCalledWith('ft');
  });

  it('does not render the Custom input when allowCustom is false', () => {
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByPlaceholderText('Custom')).toBeNull();
  });

  it('submits the custom value via onSubmitEditing when allowCustom is true', () => {
    const onSelect = jest.fn();
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        allowCustom
        customPlaceholder="Custom"
        onSelect={onSelect}
      />,
    );

    const input = screen.getByPlaceholderText('Custom');
    fireEvent.changeText(input, 'box');
    fireEvent(input, 'submitEditing');
    expect(onSelect).toHaveBeenCalledWith('box');
  });

  it('commits the custom value when the APPLY button is pressed', () => {
    const onSelect = jest.fn();
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        allowCustom
        onSelect={onSelect}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Custom'), 'box');
    fireEvent.press(screen.getByLabelText('Apply custom value'));
    expect(onSelect).toHaveBeenCalledWith('box');
  });

  it('disables the APPLY button when the custom input is blank', () => {
    const onSelect = jest.fn();
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        allowCustom
        onSelect={onSelect}
      />,
    );

    // No text typed — pressing APPLY should be a no-op (button is disabled).
    const apply = screen.getByLabelText('Apply custom value');
    expect(apply.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(apply);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('trims whitespace-only custom values before committing', () => {
    const onSelect = jest.fn();
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        allowCustom
        onSelect={onSelect}
      />,
    );

    const input = screen.getByPlaceholderText('Custom');
    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('prefills the custom input when currentValue is not a preset', () => {
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        currentValue="box"
        allowCustom
        onSelect={() => {}}
      />,
    );

    expect(screen.getByDisplayValue('box')).toBeTruthy();
  });

  it('respects customMaxLength on the custom input', () => {
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        allowCustom
        customMaxLength={4}
        onSelect={() => {}}
      />,
    );

    const input = screen.getByPlaceholderText('Custom');
    expect(input.props.maxLength).toBe(4);
  });

  it('renders the title when provided', () => {
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        title="Choose unit"
        options={unitOptions}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('Choose unit')).toBeTruthy();
  });

  it('calls onBack (or onClose fallback) when the Back button is tapped', () => {
    const onBack = jest.fn();
    const screen = render(
      <DropdownBottomSheet
        typography={typography}
        visible
        options={unitOptions}
        onBack={onBack}
        onSelect={() => {}}
      />,
    );
    fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalled();
  });
});
