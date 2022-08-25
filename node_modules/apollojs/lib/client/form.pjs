(function() {

var kTextInputTypes = {
  'text': true,
  'email': true,
  'password': true,
  'url': true,
  'tel': true,
  'search': true
};

var kNumericInputTypes = {
  'number': true,
  'range': true
};

$define(HTMLFormElement.prototype, {
  $getControls: function() {
    var controls = {};
    Array.forEach(
        $SA('input, select, textarea, button', this),
        function(el) {
          if (!el.name)
            return;
          if (!controls[el.name])
            controls[el.name] = el;
        });
    return controls;
  },
  $autoFocus: function(controls) {
    controls = controls || this.$getControls();
    for (var name in controls) {
      var control = controls[name];
      if (control.hasAttribute('autofocus'))
        control.focus();
    }
    return this;
  },
  /**
   * Make none pre-set disabled controls disabled or editable.
   * @param {bool} disabled disabled if true, editable otherwise
   */
  $setDisabled: function(disabled, controls) {
    controls = controls || this.$getControls();
    for (var name in controls) {
      var control = controls[name];
      if (control.hasAttribute('orgdisabled'))
        continue;
      if (disabled && control.hasAttribute('disabled'))
        control.setAttribute('orgdisabled', true);
      control.disabled = disabled;
    }
    return this;
  },
  $disable: function(controls) {
    return this.$setDisabled(true, controls);
  },
  $enable: function(controls) {
    return this.$setDisabled(false, controls);
  },
  $getFirstInvalidControl: function(controls, values) {
    controls = controls || this.$getControls();
    values = values || this.$getValues(controls);
    for (var name in values) {
      var control = controls[name];
      var value = values[name];
      var type = getType(control);
      var validator = getValidator(control.$getData('validator') || type, this.getAttribute('name'));
      // console.log(name, value, validator);
      if (control.hasAttribute('required') && !value ||
          value && (
            kTextInputTypes[type] && !validateTextControl(control) ||
            kNumericInputTypes[type] && !validateNumericControl(control) ||
            validator && !validator(control, value, values)
          ))
        return controls[name];
    }
    return null;
  },
  $getValues: function(controls) {
    controls = controls || this.$getControls();
    var res = {};
    for (var name in controls)
      res[name] = controls[name].$getValue();
    return res;
  },
  $setValues: function(values, controls) {
    controls = controls || this.$getControls();
    for (var name in controls)
      controls[name].$setValue(values[name]);
    return this;
  }
});

var pFieldValidators = {};

$define(HTMLFormElement, {
  $registerValidator: function(name, validator, formName) {
    formName = formName || '*';
    if (!pFieldValidators[formName])
      pFieldValidators[formName] = {};
    pFieldValidators[formName][name] = validator;
  },
  $registerValidators: function(validators, formName) {
    for (var name in validators)
      HTMLFormElement.$registerValidator(name, validators[name], formName);
  }
});

function getValidator(name, formName) {
  if (!name)
    return null;
  if (pFieldValidators[formName] &&
      pFieldValidators[formName][name])
    return pFieldValidators[formName][name];
  return pFieldValidators['*'][name];
}

function getType(control) {
  var type = control.type;
  if (!type) {
    if (control instanceof HTMLTextAreaElement ||
        control instanceof HTMLInputElement)
      type = 'text';
    else if (control instanceof HTMLSelectElement)
      type = 'select';
    else
      type = 'button';
  }
  return type;
}

function validateTextControl(control) {
  var value = control.value;
  var minLength = parseInt(control.$getAttr('minlength'), 10);
  if (minLength && value.length < minLength)
    return false;
  var maxLength = parseInt(control.$getAttr('maxlength'), 10);
  if (maxLength && value.length > maxLength)
    return false;
  var pattern = control.$getAttr('pattern');
  if (pattern)
    pattern = new RegExp('^' + pattern + '$');
  if (pattern && !pattern.test(value))
    return false;
  return true;
}

function validateNumericControl(control) {
  var value = pasreFloat(control.value.trim());
  if (isNaN(value))
    return false;
  var min = parseFloat(control.$getAttr('min'));
  if (isNaN(min) && value < min)
    return false;
  var max = parseFloat(control.$getAttr('max'));
  if (isNaN(max) && value > max)
    return false;
  return true;
}

var kControlProto = {
  $setDisabled: function(disabled) {
    this.disabled = disabled;
    return this;
  },
  $disable: function() {
    this.disabled = true;
    return this;
  },
  $enable: function() {
    this.disabled = false;
    return this;
  },
  $isDisabled: function() {
    return this.disabled;
  },
  $setValue: function(value) {
    this.value = $default(value, '');
    return this;
  },
  $getValue: function() {
    return this.value;
  }
};

var kButtonControlProto = $extend({
  $setValue: function(value) {
    this.value = $default(value, '');
    var elLabel = $C('Label', this);
    if (elLabel) {
      if (value)
        elLabel.$setData('value', value);
      else
        elLabel.$removeData('value');
    }
    return this;
  }
}, kControlProto);

var kInputControlProto = $extend({
  $setValue: function(value) {
    var type = getType(this);
    if (type == 'checkbox' || type == 'radio') {
      if (!Array.isArray(value))
        value = [value];
      var form = this.$findAncestorOfTagName('FORM');
      var inputs = $TA('input', form);
      // console.log(inputs);
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].name == this.name) {
          // Hooray, got a company;
          inputs[i].checked = value.indexOf(inputs[i].value) > -1;
        }
      }
    } else {
      this.value = $default(value, '');
    }
  },
  $getValue: function() {
    var type = getType(this);
    if (type == 'checkbox' || type == 'radio') {
      var value = [];
      var form = this.$findAncestorOfTagName('FORM');
      var inputs = $TA('input', form);
      var count = 0;
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].name == this.name) {
          count++;
          if (inputs[i].checked)
            value.push(inputs[i].value);
        }
      }
      if (count == 1 || type == 'checkbox')
        return value[0] || null;
      return value;
    }
    return this.value;
  }
}, kControlProto);

$define(HTMLButtonElement.prototype, kButtonControlProto);
$define(HTMLInputElement.prototype, kInputControlProto);
$define(HTMLSelectElement.prototype, kControlProto);
$define(HTMLTextAreaElement.prototype, kControlProto);

HTMLFormElement.$registerValidators({
  email: function(control, value) {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value);
  }
});

})();
