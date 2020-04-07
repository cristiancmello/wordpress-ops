"use strict";

class Component {
  constructor(context, id, props, events) {
    this.context = context;
    this.id = id;
    this.props = props;
    this.components = {};

    if (events && events["beforeRenderProps"]) {
      events.beforeRenderProps(this);
    }

    Object.entries(this.props).map(([key, value]) => {
      if (value instanceof Component) {
        this.props[key] = value.render();
      }
    });
  }

  render = () => {};

  addProps = (propName, content) => {
    this.props = {
      ...this.props,
      [propName]: content,
    };

    return this;
  };

  addComponent = (component) => {
    component.parent = this;
    this.components[component.id] = component.render();

    return this;
  };
}

module.exports = {
  Component,
};
