// describe('mongo-ext.js', function() {
//  it('should load proper', function() {
//    require('../mongo-ext.js');
//    $diff.should.be.an.instanceof(Function);
//    $equals.should.be.an.instanceof(Function);
//  });
// });

require('../');

describe('$define()', function() {
  var obj = $define({}, {
    a: 1,
    get x() { return this.a; },
    set x(v) { this.a = v; }
  });
  it('should define properties as non-enumerable', function() {
    Object.isEmpty(obj).should.be.true;
  });
  it('should define properties as non-configurable', function() {
    (delete obj.a).should.be.false;
  });
  it('should define getters and setters', function() {
    obj.x.should.eql(1);
    obj.x = 15;
    obj.a.should.eql(15);
    obj.x.should.eql(15);
  });
});

describe('$extend()', function() {
  var objects = {
    get lhv() {
      return {
        age: 73,
        name: {
          first: 'John',
          last: 'Lewis'
        },
        sex: {
          male: 1,
          female: 0
        },
        country: 'us'
      };
    },
    get rhv() {
      return {
        age: 74,
        name: 'John Lewis',
        sex: {
          male: 1,
          secret: 0
        },
        born: 1940
      };
    },
    get 0() {
      return {
        age: 73,
        name: {
          first: 'John',
          last: 'Lewis'
        },
        sex: {
          male: 1,
          female: 0
        },
        country: 'us',
        born: 1940
      };
    },
    get 1() {
      return {
        age: 74,
        name: 'John Lewis',
        sex: {
          male: 1,
          secret: 0
        },
        born: 1940,
        country: 'us'
      };
    },
    get 2() {
      return objects[0];
    },
    get 3() {
      return {
        age: 73,
        name: 'John Lewis',
        sex: {
          male: 1,
          female: 0,
          secret: 0
        },
        country: 'us',
        born: 1940
      };
    }
  };
  it('should extend without override', function() {

  });
  it('should extend with override, no deep', function() {

  });
  it('should not extend deep if without override', function() {

  });
  it('should extend deep if with override', function() {

  });
});

describe('$error()', function() {
  it('should return an error', function() {
    $error('%s', 'error').should.be.an.Error;
  });
});

describe('wrap and strip', function() {
  function Node(value) {
    this.value = value;
    this.children = [];
  }
  Node.prototype = {
    appendChild: function(node) {
      this.children.push(node);
      return node;
    },
    get firstChild() {
      return this.children.front;
    }
  };
  Node.__wrap = function(node) {
    for (var i = 0; i < node.children.length; i++)
      $wrap(node.children[i], Node);
  };

  var root = new Node(1);
  root.appendChild(new Node(2));

  var plainRoot = JSON.parse(JSON.stringify(root));

  describe('$wrap()', function() {
    it('should wrap a vanilla object with given Type', function() {
      var nroot = $wrap(plainRoot, Node);
      nroot.should.eql(root);
      nroot.should.be.an.instanceOf(Node);
      nroot.firstChild.should.be.an.instanceOf(Node);
    });
  });

  describe('$strip()', function() {
    it('should strip a object\'s type and return a vanilla object', function() {
      var proot = $strip(root);
      proot.should.be.an.Object.and.not.an.instanceOf(Node);
    });
  });

});

describe('$default()', function() {
  it('should return default value when giving undefined', function() {
    $default(undefined, 1).should.eql(1);
  });
  it('should return given value when it\'s not undefined', function() {
    ($default(null, 1) === null).should.be.true;
    $default(2, 1).should.eql(2);
    $default(true, 1).should.eql(true);
    $default(false, 1).should.eql(false);
  });
});

describe('$typeof()', function() {
  it('should return array', function() {
    $typeof([]).should.eql('array');
  });
  it('should return function', function() {
    $typeof(function() {}).should.eql('function');
  });
  it('should return number', function() {
    $typeof(0).should.eql('number');
  });
  it('should return object', function() {
    $typeof({}).should.eql('object');
    var Ctor = function() {};
    $typeof(new Ctor()).should.eql('object');
  });
  it('should return regexp', function() {
    $typeof(/regexp/).should.eql('regexp');
  });
  it('should return string', function() {
    $typeof('').should.eql('string');
  });
});

describe('Array', function() {
  describe('#flatten()', function() {
    it('should flatten [1, [2, 3], 4] as [1, 2, 3, 4]', function() {
      [1, [2, 3], 4].flatten().should.eql([1, 2, 3, 4]);
    });
    it('should flatten [1, [2, 3, [4]]] as [1, 2, 3, [4]]', function() {
      [1, [2, 3, [4]]].flatten().should.eql([1, 2, 3, [4]]);
    });
    it('should deep flatten [1, [2, [3, [4]]]] as [1, 2, 3, 4]', function() {
      [1, [2, [3, [4]]]].flatten(true).should.eql([1, 2, 3, 4]);
    });
  });
  describe('#rotate()', function() {
    it('should rotate [1,2,3,4,5] by -1 as [5,1,2,3,4]', function() {
      [1, 2, 3, 4, 5].rotate(-1).should.eql([5, 1, 2, 3, 4]);
    });
    it('should rotate [1,2,3,4,5] by -11 as [5,1,2,3,4]', function() {
      [1, 2, 3, 4, 5].rotate(-11).should.eql([5, 1, 2, 3, 4]);
    });
    it('should rotate [1,2,3,4,5] by 1 as [2,3,4,5,1]', function() {
      [1, 2, 3, 4, 5].rotate(1).should.eql([2, 3, 4, 5, 1]);
    });
    it('should rotate [1,2,3,4,5] by 2 as [3,4,5,1,2]', function() {
      [1, 2, 3, 4, 5].rotate(2).should.eql([3, 4, 5, 1, 2]);
    });
    it('should rotate [1,2,3,4,5] by 3 as [4,5,1,2,3]', function() {
      [1, 2, 3, 4, 5].rotate(3).should.eql([4, 5, 1, 2, 3]);
    });
    it('should rotate [1,2,3,4,5] by 4 as [5,1,2,3,4]', function() {
      [1, 2, 3, 4, 5].rotate(4).should.eql([5, 1, 2, 3, 4]);
    });
    it('should rotate [1,2,3,4,5] by 0 as [1,2,3,4,5]', function() {
      [1, 2, 3, 4, 5].rotate(0).should.eql([1, 2, 3, 4, 5]);
    });
    it('should rotate [1,2,3,4] by 1 as [2,3,4,1]', function() {
      [1, 2, 3, 4].rotate(1).should.eql([2, 3, 4, 1]);
    });
    it('should rotate [1,2,3,4] by 2 as [3,4,1,2]', function() {
      [1, 2, 3, 4].rotate(2).should.eql([3, 4, 1, 2]);
    });
    it('should rotate [1] by 0 as [1]', function() {
      [1].rotate(0).should.eql([1]);
    });
  });
  describe('#unique()', function() {
    it('should return [1,3,2] after unique [1,3,2,3,2,1]', function() {
      [1,3,2,3,2,1].unique().should.eql([1,3,2]);
    });
    it('should return [] after unique []', function() {
      [].unique().should.eql([]);
    });
    it('should return [1] after unique [1, "1"]', function() {
      [1, "1"].unique().should.eql([1]);
    });
  });
  describe('#min()', function() {
    it('should return the minimal number in array', function() {
      [1, 2, 3, 4, 5].min().should.eql(1);
      [1.1, -10].min().should.eql(-10);
    });
    it('should return undefined when array is empty', function() {
      ([].min() === undefined).should.be.true;
    });
  });
  describe('#max()', function() {
    it('should return the maximum number in array', function() {
      [1, 2, 3, 4, 5].max().should.eql(5);
      [1.1, -10].max().should.eql(1.1);
    });
    it('should return undefined when array is empty', function() {
      ([].max() === undefined).should.be.true;
    });
  });
  describe('#add()', function() {
    it('should return the new index of adding value in array', function() {
      [1, 2, 3].add(4).should.eql(3);
      [].add(1).should.eql(0);
    });
    it('should return the first existing index of adding value in array', function() {
      [1, 2, 2].add(2).should.eql(1);
    });
  });
  describe('#remove()', function() {
    it('should remove the first appearance of given value', function() {
      [1, 2, 3].remove(1).should.eql([2, 3]);
      [].remove(1).should.eql([]);
      [1, null, undefined].remove(null).should.eql([1, undefined]);
      [1, undefined, undefined].remove(undefined).should.eql([1, undefined]);
    });
  });
  describe('front', function() {
    it('should return the first element of array', function() {
      [1, 2, 3].front.should.eql(1);
      ([].front === undefined).should.be.true;
    });
  });
  describe('back', function() {
    it('should return the last element of array', function() {
      [1, 2, 3].back.should.eql(3);
      ([].back === undefined).should.be.true;
    });
  });
  describe('#shuffle()', function() {
    it('should shuffle the given array with even ', function() {
      var n = 3;
      var countTests = 10000;
      var countAscPermutaion = 0;
      var countTotalPermutaion = 1;
      var arr = [], i, j;
      for (i = 0; i < n; i++) {
        arr[i] = i;
        countTotalPermutaion *= i + 1;
      }
      for (i = 0; i < countTests; i++) {
        arr.shuffle();
        var ascPermutaion = true;
        for (j = 0; j < n; j++)
          if (arr[j] != j) {
            ascPermutaion = false;
            break;
          }
        if (ascPermutaion)
          countAscPermutaion++;
      }
      (countAscPermutaion / countTests * countTotalPermutaion)
          .should.approximately(1, 1e-1);
    });
  });
  ['forEach', 'every', 'some', 'filter', 'map', 'reduce', 'reduceRight', 'slice'].forEach(function(fnName) {
    function nothing(i) {
      return i;
    }
    describe(fnName + '()', function() {
      var objArr = {
        0: 0,
        1: 1,
        length: 2
      };
      var charArr = '01';
      var arr = [0, 1];
      it('should work on array-like instances', function() {
        Array[fnName](objArr, nothing);
        Array[fnName](charArr, nothing);
        Array[fnName](arr, nothing);
      });
    });
  });
});

describe('String', function() {
  describe('#paddingLeft()', function() {
    it('should pad a string to given length and char from left', function() {
      'a'.paddingLeft('b', 5).should.eql('bbbba');
      'a'.paddingLeft('b', 1).should.eql('a');
      ''.paddingLeft('b', 1).should.eql('b');
    });
  });
  describe('#paddingRight()', function() {
    it('should pad a string to given length and char from right', function() {
      'a'.paddingRight('b', 5).should.eql('abbbb');
      'a'.paddingRight('b', 1).should.eql('a');
      ''.paddingRight('b', 1).should.eql('b');
    });
  });
  describe('front', function() {
    it('should return the first character of string', function() {
      '123'.front.should.eql('1');
      (''.front === undefined).should.be.true;
    });
  });
  describe('back', function() {
    it('should return the last character of string', function() {
      '123'.back.should.eql('3');
      (''.back === undefined).should.be.true;
    });
  });
  describe('#startsWith()', function() {
    it('should be able to determin if A starts with B', function() {
      'a'.startsWith('').should.be.true;
      'a'.startsWith(null).should.be.true;
      'a'.startsWith().should.be.true;
      ''.startsWith('').should.be.true;
      ''.startsWith(null).should.be.true;
      ''.startsWith().should.be.true;
      'ab'.startsWith('ab').should.be.true;
      'a'.startsWith('b').should.be.false;
      'ab'.startsWith('b').should.be.false;
      'ab'.startsWith('b', 1).should.be.true;
    });
  });
  describe('#endsWith()', function() {
    it('should be able to determin if A ends with B', function() {
      'a'.endsWith('').should.be.true;
      'a'.endsWith(null).should.be.true;
      'a'.endsWith().should.be.true;
      ''.endsWith('').should.be.true;
      ''.endsWith(null).should.be.true;
      ''.endsWith().should.be.true;
      'ab'.endsWith('ab').should.be.true;
      'a'.endsWith('b').should.be.false;
      'ab'.endsWith('b').should.be.true;
      'ab'.endsWith('a', 1).should.be.true;
    });
  });
  describe('#toTitleCase()', function() {
    it('should return correct title case form of A', function() {
      'a'.toTitleCase().should.eql('A');
      ''.toTitleCase().should.eql('');
      'ab'.toTitleCase().should.eql('Ab');
      'abc'.toTitleCase().should.eql('Abc');
      'abc a def'.toTitleCase().should.eql('Abc A Def');
      'abc a def  '.toTitleCase().should.eql('Abc A Def  ');
      '  abc def  '.toTitleCase().should.eql('  Abc Def  ');
      'abc def\'s'.toTitleCase().should.eql('Abc Def\'s');
      'abc dEef'.toTitleCase().should.eql('Abc dEef');
      'abc Def'.toTitleCase().should.eql('Abc Def');
      'abc DEF'.toTitleCase().should.eql('Abc DEF');
    });
  });
  ['trim', 'trimLeft', 'trimRight'].forEach(function(fnName) {
    var str = ' a ';
    var buffer = new Buffer(str);
    describe(fnName + '()', function() {
      String[fnName](buffer).should.eql(str[fnName].call(str));
    });
  });
});

describe('Number', function() {
  describe('#clamp()', function() {
    it('should be able to clamp a number to the given range', function() {
      (15).clamp(1, 10).should.eql(10);
      (10).clamp(1, 10).should.eql(10);
      (1).clamp(1, 10).should.eql(1);
      (-10).clamp(1, 10).should.eql(1);
    });
  });
  describe('#floor()', function() {
    it('should return the floor(this)', function() {
      (2-1e-8).floor().should.eql(1);
      (1).floor().should.eql(1);
    });
  });
  describe('#ceil()', function() {
    it('should return ceil(this)', function() {
      (2-1e-8).ceil().should.eql(2);
      (2).ceil().should.eql(2);
    });
  });
  describe('#round()', function() {
    it('should round the number', function() {
      (1.4).round().should.eql(1);
      (1.5).round().should.eql(2);
      (1.5).round(1).should.eql(1.5);
      (1.45).round(1).should.eql(1.5);
    });
  });
  describe('#toGroup()', function() {
    it('should return the thousands separated number', function() {
      (1).toGroup().should.eql('1');
      (12).toGroup().should.eql('12');
      (123).toGroup().should.eql('123');
      (1234).toGroup().should.eql('1,234');
      (12345).toGroup().should.eql('12,345');
      (123456).toGroup().should.eql('123,456');
      (1234567).toGroup().should.eql('1,234,567');
      (12345678).toGroup().should.eql('12,345,678');
      (123456789).toGroup().should.eql('123,456,789');
      (1234567890).toGroup().should.eql('1,234,567,890');
      (1234567890.123).toGroup(3).should.eql('1,234,567,890.123');
      (1234567890.123).toGroup(3, 'a').should.eql('1a234a567a890.123');
    });
  });
});

describe('Object', function() {
  describe('isEmpty()', function() {
    it('should return true for null/undefined/false/""/{}', function() {
      Object.isEmpty(null).should.be.true;
      Object.isEmpty().should.be.true;
      Object.isEmpty(false).should.be.true;
      Object.isEmpty('').should.be.true;
      Object.isEmpty({}).should.be.true;
    });
    it('should return false when object has enumerable properties', function() {
      Object.isEmpty({
        a: 123
      }).should.be.false;
    });
  });
  describe('values()', function() {
    it('should return values of an object in an array', function() {
      Object.values({}).should.eql([]);
      Object.values({a: 1}).should.eql([1]);
      Object.values({a: 1, b: 2}).should.eql([1, 2]);
      Object.values({a: 1, b: 1}).should.eql([1, 1]);
      Object.values({1: 1, 2: 2}).should.eql([1, 2]);
    });
  });
  describe('project()', function() {
    var sample = {
      x0: 0,
      x1: 1,
      x2: 2,
      x: {
        xx0: 0,
        xx1: 1,
        xx2: 2,
        xx: {
          xxx0: 0,
          xxx1: 1,
          xxx2: undefined
        }
      }
    };
    it('should project the object to the target shallow', function() {
      Object.project(sample, {
        x: {
          xx0: 1
        }
      }).should.eql({
        x: sample.x
      });
    });
    it('should project the object to the target deep', function() {
      Object.project(sample, {
        x: {
          xx0: 1
        }
      }, true).should.eql({
        x: {
          xx0: 0
        }
      });
    });
    it('should project the object to the target deep & multi', function() {
      Object.project(sample, {
        x: {
          xx: {
            xxx0: 1
          },
          xx1: 1
        }
      }, true).should.eql({
        x: {
          xx: {
            xxx0: 0
          },
          xx1: 1
        }
      });
    });
    it('should remove undefined field', function() {
      Object.project(sample, {
        x: {
          xx: {
            xxx2: 1
          }
        }
      }, true).should.eql({
        x: {
          xx: {}
        }
      });
    });
    it('should keep undefined field', function() {
      Object.project(sample, {
        x: {
          xx: {
            xxx2: 1
          }
        }
      }, true, true).should.eql({
        x: {
          xx: {
            xxx2: undefined
          }
        }
      });
    });
    it('should throw, as do not support flatten key', function() {
      (function() {
        Object.project(sample, {
          'x.xx1': 1
        }, true).should.eql({
          x: {
            xx1: 1
          }
        });
      }).should.throw();
    });
    it('should throw, as do not support revert mode', function() {
      (function() {
        Object.project(sample, {
          x: 0
        }).should.eql({
          x0: 0,
          x1: 1,
          x2: 2
        });
      }).should.throw();
    });
  });
  describe('Transformer()', function() {
    it('should transform object', function() {
      var transformer = new Object.Transformer({
        name: true,
        'good.morning': '.name',
        good: {
          evening: '.name'
        },
        upperCase: function(el) {return el.name.toUpperCase();}
      });
      transformer.exec({
        name: 'yan'
      }).should.eql({
        name: 'yan',
        upperCase: 'YAN',
        'good.morning': 'yan',
        good: {
          evening: 'yan'
        }
      });
    });
  });
});

describe('Function', function() {
  describe('isFunction()', function() {
    it('should return true for a function', function() {
      Function.isFunction(function() {}).should.be.true;
      Function.isFunction((function() {}).bind()).should.be.true;
      Function.isFunction(Date).should.be.true;
      Function.isFunction(Function).should.be.true;
    });
    it('should return false for other cases', function() {
      Function.isFunction(true).should.be.false;
      Function.isFunction({}).should.be.false;
      Function.isFunction(123).should.be.false;
      Function.isFunction('').should.be.false;
      Function.isFunction().should.be.false;
      Function.isFunction(null).should.be.false;
      Function.isFunction(new Date()).should.be.false;
    });
  });
});

describe('Boolean', function() {
  describe('cast()', function() {
    ['ok', 'yes', 'y', 'true', 'y', 'on', 'True', 1, true, {}].forEach(function(obj) {
      it($format('should cast %j as true', obj), function() {
        Boolean.cast(obj).should.be.true;
      });
    });
    ['', 'no', 'WORD', null, undefined, 0/0, 0, false].forEach(function(obj) {
      it($format('should cast %j as false', obj), function() {
        Boolean.cast(obj).should.be.false;
      });
    });
  });
});

describe('RegExp', function() {
  describe('escape()', function() {
    Array.forEach('-/\\^$*+?.()|[]{}', function(ch) {
      it('should escape ' + ch, function() {
        new RegExp(RegExp.escape(ch)).test(ch).should.be.true;
      });
    });
  });
});

describe('JSON', function() {
  describe('tryParse()', function() {
    it('should parse valid json as usual', function() {
      JSON.tryParse('{}').should.eql({});
      JSON.tryParse('{"a":true}').should.eql({a: true});
    });
    it('should parse invalid json as undefined without throw', function() {
      (JSON.tryParse('{,}') === undefined).should.be.true;
      (JSON.tryParse('{a:true}') === undefined).should.be.true;
    });
  });
});
