import { useDispatch, useSelector } from "react-redux";
import { hideActionOnPokemon, selectActionOnPokemon, setItemUsedInBattle } from "../state/uiSlice";
import { selectPokemonEncounter } from "../state/gameSlice";
import PokemonList from "./PokemonList";

const ActionOnPokemon = () => {
  const dispatch = useDispatch();
  const action = useSelector(selectActionOnPokemon);
  const inBattle = !!useSelector(selectPokemonEncounter);

  if (!action) return null;

  return (
    <PokemonList
      close={() => dispatch(hideActionOnPokemon())}
      clickPokemon={(index) => {
        action(index);
        // Marcar que se usó un objeto en batalla para que el rival ataque después
        if (inBattle) dispatch(setItemUsedInBattle(true));
        dispatch(hideActionOnPokemon());
      }}
      text="Elige un POKÉMON."
    />
  );
};

export default ActionOnPokemon;
