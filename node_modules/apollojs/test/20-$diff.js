// require('../');
// var should = require('should');
// // var Server = require('mongodb').Server;
// // var MontoClient = require('mongodb').MongoClient;

// // var client = new MongoClient(new Server(hostname, port, {
// //   poolSize: 20,
// //   auto_reconnect: true,
// //   socketOptions: { keepAlive: 7200000 }
// // }));
// // client.open(function(err, cilent) {
// //   if(err) throw(err);
// //   var db=client.db('apollo');
// //   var diff_insert = db.collection('diff_insert');
// //   var diff_update = db.collection('diff_update');

// //   describe('')
// // });
// var tests = [{
//   name: 'Leather Boot',
//   designer: 'ami',
//   site: {
//     id: 'mf',
//     hostname: 'www.mf.com'
//   },
//   sizes: [
//     {
//       sku: '133467-0',
//       size: {
//         id: 'boot.0',
//         origin: '34 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     },
//     {
//       sku: '133467-1',
//       size: {
//         id: 'boot.1',
//         origin: '36 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     }
//   ]
// }, {
//   name: 'Leather Boot',
//   designer: 'ami',
//   site: {
//     id: 'mf',
//     hostname: 'www.mf.com'
//   },
//   sizes: [
//     {
//       sku: '133467-0',
//       size: {
//         id: 'boot.0',
//         origin: '34 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     },
//     {
//       sku: '133467-0',
//       size: {
//         id: 'boot.0',
//         origin: '34 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     },
//     {
//       sku: '133467-0',
//       size: {
//         id: 'boot.0',
//         origin: '34 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     },
//     {
//       sku: '133467-0',
//       size: {
//         id: 'boot.0',
//         origin: '34 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     },
//     {
//       sku: '133467-1',
//       size: {
//         id: 'boot.1',
//         origin: '36 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     }
//   ]
// }
// ];
// describe("$diff", function() {
//   it("should create a comlete $set object", function() {
//     $diff(tests[0]).should.eql({
//       $set: tests[0]
//     });
//   });
//   it('should return null', function() {
//     should.equal($diff(tests[0], tests[1]), null);
//   });
//   it('should $push an new size to sizes', function(){
//     var target = $clone(tests[0]);
//     target.sizes = target.sizes.slice(0);
//     target.sizes.push({
//       sku: '133467-2',
//       size: {
//         id: 'boot.2',
//         origin: '38 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     });
//     target.sizes.push({
//       sku: '133467-3',
//       size: {
//         id: 'boot.3',
//         origin: '40 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     });
//     $diff(tests[0], target).should.eql({
//       $push: {
//         sizes: {
//           $each: [{
//             sku: '133467-2',
//             size: {
//               id: 'boot.2',
//               origin: '38 FR'
//             },
//             price: {
//               fullCNY: 13333,
//               saleCNY: null
//             }
//           },{
//             sku: '133467-3',
//             size: {
//               id: 'boot.3',
//               origin: '40 FR'
//             },
//             price: {
//               fullCNY: 13333,
//               saleCNY: null
//             }
//           }]

//         }
//       }
//     });
//   });
//   it('should $pull from sizes', function(){
//     var target = $clone(tests[0]);
//     target.sizes = target.sizes.slice(1);
//     $diff(tests[0], target).should.eql({
//       $pull: { sizes: tests[0].sizes[0] }
//     });
//   });
//   it('should $set sizes, as we pull multiple values from sizes', function() {
//     var target = $clone(tests[0]);
//     target.sizes = target.sizes.slice(2);
//     $diff(tests[0], target).should.eql({
//       $set: { sizes: target.sizes }
//     });
//   });
//   it('should $set sizes, as we pull/push sizes in same time', function() {
//     var target = $clone(tests[0]);
//     target.sizes = target.sizes.slice(1);
//     target.sizes.push({
//       sku: '133467-2',
//       size: {
//         id: 'boot.2',
//         origin: '38 FR'
//       },
//       price: {
//         fullCNY: 13333,
//         saleCNY: null
//       }
//     });
//     $diff(tests[0], target).should.eql({
//       $set: { sizes: target.sizes }
//     });
//   });
//   it('should unset name field', function() {
//     var target = $clone(tests[0]);
//     target.name = undefined;
//     $diff(tests[0], target).should.eql({
//       $unset: { name: 1 }
//     });
//   });
//   it('should $set name to `Leather Star Boot`, $set site.hostname to `www.matchesfashion.com`, $pull sizes', function() {
//     var target = $clone(tests[0]);
//     target.site = $clone(target.site);
//     target.name = "Leather Star Boot";
//     target.site.hostname = "www.matchesfashion.com";
//     target.sizes = target.sizes.slice(1);
//     $diff(tests[0], target).should.eql({
//       $set: {
//         name: 'Leather Star Boot',
//         "site.hostname": "www.matchesfashion.com"
//       },
//       $pull: {
//         sizes: tests[0].sizes[0]
//       }
//     });
//   });
//   it('should finish 20000 diff in 1 sec', function() {
//     var start = Date.now();
//     for(var i=0; i<20000; ++i)
//       $diff(tests[0], tests[1]);
//     if(Date.now() - start > 1000) throw $error('timeout');

//   });
// });

