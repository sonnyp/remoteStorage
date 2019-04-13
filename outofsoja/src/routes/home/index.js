import { h, Component } from "preact";
import style from "./style";
// import Item from "./item";
import classNames from "classnames";

const Item = ({ item, onRemove, onChange, ...props }, state) => {
  const { value, done } = item;

  return (
    <li class={style.item} {...props}>
      <div
        class={classNames({ [style.done]: done })}
        onClick={() => onChange(!done)}
      >
        {value}
      </div>
      {done && (
        <button class={style.remove} onClick={onRemove}>
          🗑
        </button>
      )}
    </li>
  );
};

class List extends Component {
  state = {
    items: [{ value: "foo", done: false }, { value: "bar", done: true }],
  };

  handleSubmit = evt => {
    evt.preventDefault();
    const value = evt.target.elements.new.value;
    if (!value) return;

    navigator.vibrate(30);

    this.setState({
      items: [{ value, done: false }, ...this.state.items],
    });

    evt.target.reset();
  };

  handleItemPress(item) {
    navigator.vibrate(30);

    item.done = !item.done;

    this.setState({
      items: this.state.items,
    });
  }

  handleItemRemove(item) {
    navigator.vibrate(30);

    this.setState({ items: this.state.items.filter(i => i !== item) });
  }

  render(props, state) {
    const { items } = state;

    return (
      <div class={style.root}>
        <form onSubmit={this.handleSubmit} class={style.form}>
          <input
            autofocus
            autocomplete="off"
            type="text"
            name="new"
            placeholder="soja"
          />
          <input
            type="submit"
            value="➕"
            class={style.addButton}
            class={style.submit}
          />
        </form>

        <ul class={style.list}>
          {items.map((item, idx) => (
            <Item
              key={idx}
              item={item}
              onChange={() => {
                this.handleItemPress(item);
              }}
              onRemove={() => this.handleItemRemove(item)}
            />
          ))}
        </ul>
      </div>
    );
  }
}

export default List;
