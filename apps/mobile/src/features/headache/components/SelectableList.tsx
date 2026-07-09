import { Fragment } from 'react';
import { ListSelectItem } from './ListSelectItem';

interface Props {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** Lista de itens multi-seleção (texto simples). */
export function SelectableList({ options, selected, onToggle }: Props) {
  return (
    <Fragment>
      {options.map((opt) => (
        <ListSelectItem
          key={opt}
          label={opt}
          selected={selected.includes(opt)}
          onPress={() => onToggle(opt)}
        />
      ))}
    </Fragment>
  );
}
