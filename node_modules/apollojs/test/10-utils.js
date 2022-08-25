require('../');

if (global.$utils) {

describe('$utils', function() {
  describe('encodeRLE', function() {
    it('should encode string ([^0-9a-z]) in RLE format', function() {
      $utils.encodeRLE('AAA').should.eql('3A');
      $utils.encodeRLE('AA').should.eql('AA');
      $utils.encodeRLE('AABBBCCCCCCD').should.eql('AA3B6CD');
      $utils.encodeRLE('XRLCPJYZHHJYLKOVDTIP').should.eql('XRLCPJYZHHJYLKOVDTIP');
      $utils.encodeRLE('LRBETYSBEIQMPIRVZHMO').should.eql('LRBETYSBEIQMPIRVZHMO');
      $utils.encodeRLE('FLVIZHRBDHVAUSFJTXMG').should.eql('FLVIZHRBDHVAUSFJTXMG');
      $utils.encodeRLE('IYIIGNHSTHHKWILGUAOU').should.eql('IYIIGNHSTHHKWILGUAOU');
      $utils.encodeRLE('IRVVKSQOHRKJPJMFUZFC').should.eql('IRVVKSQOHRKJPJMFUZFC');
      $utils.encodeRLE('ISWSEWSBDRFEBIHGSXPY').should.eql('ISWSEWSBDRFEBIHGSXPY');
      $utils.encodeRLE('BZGNWWQHXWKSJGFRAVZJ').should.eql('BZGNWWQHXWKSJGFRAVZJ');
      $utils.encodeRLE('SEQHWKOTRGWTIAWKJKHG').should.eql('SEQHWKOTRGWTIAWKJKHG');
      $utils.encodeRLE('FSOWBWUKCECTSADURTFM').should.eql('FSOWBWUKCECTSADURTFM');
      $utils.encodeRLE('PZFCXEYFJGFJQVQRJFQD').should.eql('PZFCXEYFJGFJQVQRJFQD');
    });
    it('should decode string in RLE format', function() {
      $utils.decodeRLE('AAA').should.eql('AAA');
      $utils.decodeRLE('2A').should.eql('AA');
      $utils.decodeRLE('2A3CaZ').should.eql('AACCCZZZZZZZZZZ');
      $utils.decodeRLE('XRLCPJYZHHJYLKOVDTIP').should.eql('XRLCPJYZHHJYLKOVDTIP');
      $utils.decodeRLE('LRBETYSBEIQMPIRVZHMO').should.eql('LRBETYSBEIQMPIRVZHMO');
      $utils.decodeRLE('FLVIZHRBDHVAUSFJTXMG').should.eql('FLVIZHRBDHVAUSFJTXMG');
      $utils.decodeRLE('IYIIGNHSTHHKWILGUAOU').should.eql('IYIIGNHSTHHKWILGUAOU');
      $utils.decodeRLE('IRVVKSQOHRKJPJMFUZFC').should.eql('IRVVKSQOHRKJPJMFUZFC');
      $utils.decodeRLE('ISWSEWSBDRFEBIHGSXPY').should.eql('ISWSEWSBDRFEBIHGSXPY');
      $utils.decodeRLE('BZGNWWQHXWKSJGFRAVZJ').should.eql('BZGNWWQHXWKSJGFRAVZJ');
      $utils.decodeRLE('SEQHWKOTRGWTIAWKJKHG').should.eql('SEQHWKOTRGWTIAWKJKHG');
      $utils.decodeRLE('FSOWBWUKCECTSADURTFM').should.eql('FSOWBWUKCECTSADURTFM');
      $utils.decodeRLE('PZFCXEYFJGFJQVQRJFQD').should.eql('PZFCXEYFJGFJQVQRJFQD');
    });
  });

});

}
