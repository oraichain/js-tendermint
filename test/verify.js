// let randomBytes = require('crypto').pseudoRandomBytes;
// let test = require('tape');
// let ed25519 = require('supercop.js');
const { getValidatorSetHash, treeHash } = require("../lib/hash.js");
let { verifyCommit, getVoteSignBytes } = require("../lib/verify.js");
const { ValidatorHashInput } = require("../src/types.js");
let randomBytes = require("crypto").pseudoRandomBytes;
// console.log(
//   new Array(32).fill(0).map((item) => randomBytes(32).toString("hex"))
// );
// let { getAddress } = require('../lib/pubkey.js');
// let { getValidatorSetHash, getBlockHash } = require('../lib/hash.js');

// test('verifyCommit with mismatched header and commit', (t) => {
//   let validators = genValidators();
//   let header = genGenesisHeader(validators);
//   let commit = genCommit(genGenesisHeader(validators), validators);
//   t.throws(() => verifyCommit(header, commit, validators), 'Commit does not match block hash');
//   t.end();
// });

// test('verifyCommit with mismatched header and precommit', (t) => {
//   let validators = genValidators();
//   let header = genGenesisHeader(validators);
//   let commit = genCommit(header, validators);
//   let commit2 = genCommit(genGenesisHeader(validators), validators);
//   // copy a precommit for a different header
//   commit.precommits[20] = commit2.precommits[20];
//   t.throws(() => verifyCommit(header, commit, validators), 'Precommit block hash does not match commit');

//   t.end();
// });

// test('verifyCommit with fixture', (t) => {
// let validators = [
//   {
//     address: '00BA391A74E7DFDE058DF93DFCEBAD5980E5330D',
//     pub_key: {
//       type: 'tendermint/PubKeyEd25519',
//       value: 'KHcvGxobAi0VjlBfjYU2A5SIl571qXuIeMIv9nyLTmU='
//     },
//     voting_power: '10',
//     proposer_priority: '0'
//   }
// ];
// let header = {
//   version: {
//     block: '10',
//     app: '0'
//   },
//   chain_id: 'test-chain-0ExC6E',
//   height: '15',
//   time: '2020-03-23T23:04:27.217591086Z',
//   last_block_id: {
//     hash: '0E1011B6D7CF5BD72DC505837E81F84916EACB7EF7B0AA223C7F3E14E3DB6CA5',
//     parts: {
//       total: '1',
//       hash: '2BBE679AEC7B43F418DC39F281F2713F1C9AF0AFD413D6072379877D49BD315F'
//     }
//   },
//   last_commit_hash: 'A10FD6F0E34214B2A05314724AE7A0122D8E17FBA786C3A1E2175840518AFE31',
//   data_hash: '',
//   validators_hash: 'D1023F5B4022334F6D000080572565D468028E485E081089CDA21BBCC31F6DAC',
//   next_validators_hash: 'D1023F5B4022334F6D000080572565D468028E485E081089CDA21BBCC31F6DAC',
//   consensus_hash: '048091BC7DDC283F77BFBF91D73C44DA58C3DF8A9CBC867405D8B7F3DAADA22F',
//   app_hash: '000000000000000B',
//   last_results_hash: '',
//   evidence_hash: '',
//   proposer_address: '00BA391A74E7DFDE058DF93DFCEBAD5980E5330D'
// };
// let commit = {
//   height: '15',
//   round: '0',
//   block_id: {
//     hash: '1FF1F9E06945CCFCAB2F1EEF42B24D462B06E005685BC8DEFA428706BE30B21C',
//     parts: {
//       total: '1',
//       hash: '6E581F5F989C9C94C0D95E336C122F6D685EF79DE8C6227C63F7B6169AF8C4B7'
//     }
//   },
//   signatures: [
//     {
//       block_id_flag: 2,
//       validator_address: '00BA391A74E7DFDE058DF93DFCEBAD5980E5330D',
//       timestamp: '2020-03-23T23:04:28.36126444Z',
//       signature: 'ITM9rAZl1SfgwfF8aXbNUGgzO9cvQ6cLKcZrCNCalwdkaY/gTD2dBR1HBOrMq1MbmtYGXyH1un40DXBOfu+3Bg=='
//     }
//   ]
// };
const { validators, header, commit } = require("./new_data.json");
verifyCommit(header, commit, validators);
// console.log(getValidatorSetHash(validators));

// console.log(validators.map((v) => v.address));
// console.log(commit.signatures.map((c) => c.validator_address));

//   t.pass();
//   t.end();
// });

// function genGenesisHeader(validators) {
//   let validatorsHash = getValidatorSetHash(validators);
//   return {
//     version: { block: 123, app: 456 },
//     chain_id: Math.random().toString(36),
//     height: 1,
//     time: new Date().toISOString(),
//     num_txs: 0,
//     last_block_id: {
//       hash: '',
//       parts: { total: '0', hash: '' }
//     },
//     total_txs: 0,
//     last_commit_hash: '',
//     data_hash: '',
//     validators_hash: validatorsHash,
//     next_validators_hash: validatorsHash,
//     consensus_hash: genHash(),
//     app_hash: '',
//     last_results_hash: '',
//     evidence_hash: '',
//     proposer_address: '0001020304050607080900010203040506070809'
//   };
// }

// function genCommit(header, validators) {
//   let blockId = {
//     hash: getBlockHash(header),
//     parts: {
//       total: 1,
//       hash: genHash()
//     }
//   };
//   let precommits = [];
//   let time = new Date(header.time).getTime();
//   for (let i = 0; i < validators.length; i++) {
//     let validator = validators[i];
//     let precommit = {
//       validator_address: validator.address,
//       validator_index: String(i),
//       height: header.height,
//       round: '0',
//       timestamp: new Date(time + Math.random() * 1000).toISOString(),
//       type: 2,
//       block_id: blockId
//     };
//     let signBytes = Buffer.from(getVoteSignBytes(header.chain_id, precommit));
//     let pub = Buffer.from(validator.pub_key.value, 'base64');
//     let signature = ed25519.sign(signBytes, pub, validator.priv_key);
//     precommit.signature = {
//       type: 'tendermint/SignatureEd25519',
//       value: signature.toString('base64')
//     };
//     precommits.push(precommit);
//   }
//   return {
//     block_id: blockId,
//     precommits
//   };
// }

// function genValidators() {
//   let validators = [];
//   for (let i = 0; i < 100; i++) {
//     let priv = randomBytes(32);
//     let pub = {
//       type: 'tendermint/PubKeyEd25519',
//       value: priv.toString('base64')
//     };
//     validators.push({
//       priv_key: priv,
//       pub_key: pub,
//       address: getAddress(pub),
//       voting_power: '10',
//       accum: '0'
//     });
//   }
//   return validators;
// }

// function genHash() {
//   return randomBytes(20).toString('hex').toUpperCase();
// }

const data = [
  {
    address: "B87FCDF6D0790AC50ED3C3508E177A7618DCAF9F",
    pub_key: "1StBuTzFRapcoqYkzlfV+X17dvrxFHxEnjFAvDs7+vM=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "8B1C11D07FBECCE449CAEC697F66CE69AD171B2A",
    pub_key: "fr2m44CowQuRUURQcb1wNEzfJLusO5xPEC5GbVSnQJs=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "3973BC89A5C1C6ABA7A1627E52A8380C35D59A19",
    pub_key: "WTr4DafbcfdpDhuPhUEQPJYu3no6xLI5w18cKsP3PSk=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "71D191D8FB995182E320480521B7799B468E3CB2",
    pub_key: "E9hDaph+o3y6iJeX1iQYmC2MbYAShJC1gYxs1hv9mvY=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "A442150F839A926E57DA8B4BF120615AB5D2ED85",
    pub_key: "bqzp+Iq0ojcxESmb2nnAm/mM/E3C+u9gJnFbARFoDi4=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "174E6C4DC39ACDB1099A0F5936762343E71C316D",
    pub_key: "KdPsODLF27lHalEnUSIWnpkTYSd57tp2RIDOYPPIgW0=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "1D9B6091E7FA6B87330E9A8B4354CAE60F785B9A",
    pub_key: "mMQhXqOx17T9px2kjOLwK3arOYKwpw1ljZROp0RVivU=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "E16B05CACD30151474C05BB513DF884B2960A625",
    pub_key: "CYQEYN4faj03zNcOc2F0gdkM2DIiZmhERA8ofZAwR3M=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "C79E919D86F46D48BD97443D1E90C9C87DA6ED96",
    pub_key: "5/BbBqJ8vZt7lChBOnIv7J9NtQp2JAw6d432L8WoSF8=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "C21068E8B4623FF6B92DFE394ACE81F6D0918C79",
    pub_key: "4ylLl9YeNOv3wKDvct/ZI0fv8AaiLP7Jf/6X/edkkCg=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "024CF5E4B003D934B5701C3E3FE3D757712293CA",
    pub_key: "MXBZRUSVm2cN5gH31rn7EmKtv6i5W7VDa+YF5REqCBg=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "0C270AEEEF426D0569DAD0A93FE31AA580CFA03D",
    pub_key: "IxnDVU3Q75+rDmp+67hUJu+MCZnNNSbdsd1sKCIwUxM=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "02895E114195D00421032FB92E478D5818EC2B21",
    pub_key: "kMMAG8zujGhHoaRZWved4m+Ay3Ltb+wk7rZgOi5WCrY=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "86A1FDC92003D33A61DD1EC9AE606033A2D97504",
    pub_key: "c8MGn0xWKMa51iaGhPnSRvot4BMeHkhTOserZJ17A88=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "B08401849AF4D80D9DC883183FE03E759A65D2E1",
    pub_key: "805NJq3dGjCqWL41usVnSm0U5t6ntsdcqbeNg46GakA=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "5BDAF34772EF71D4EFD6FA2A6CE723E76495BA13",
    pub_key: "tPL5SfZUES6/6BZ6GY+XY62a2HTarKG+e3g+k35EWvg=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "E720689F200A4C219ABFA8DDBAF3DE2FE6A18C05",
    pub_key: "R/6ng64K4GgmVSM8Y7Ajk/nGWKRo3UnKGFl46lrlOOs=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "5BEE2D763600DD05A20D7E2C677CD4652B66461F",
    pub_key: "VLQALt8Vx8YUWMQy24u3xjJZRJ4/OY4yW4xf/RFQg1E=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "E0FBCAEF05A31878AB7FD70528357D0770D5AB05",
    pub_key: "xJBdg4mdm5IgW/tjdrIDRPkIHjm9AexM3Sw8KTelNXA=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "335E9200836461357806272E1D422013A1689AD2",
    pub_key: "sypD9FZfh02dA60RefwPssxG2Pzr3s6AcP38oPitxKY=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "4330CB062676C8FACC5C3A5C265CA04AC1B1548E",
    pub_key: "NGVhsK3mAmx2TBUpFAW9K9UQF389jaR2ZvsBhe6qP/Y=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "2E5D85A081F62CB876B817EC5DC900DDC5007950",
    pub_key: "rbs9CovarSGamVCutZUhVBR1DX9Gy+pQYfQ4JWmuKoo=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "F5957609C6B9B6187BEF00509068504CA5AF10F0",
    pub_key: "JscARSSZHFeBfPSLhxgcyqW6JZ24SxG5GLlUQtX5tQk=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "5F3D2ADC224B8EC0D43F90EE94F0FD1B100148B5",
    pub_key: "vxKQ5BMNXxFC5IjxSAmnVaZmyHsiffNo6I4cnCkDGIM=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "02D47D5F5A2B872DA80587A630F72C61E969B871",
    pub_key: "UnRJHAXPQxgKiIPfSRzn0EDRUpEiKN/rPuHwKG9FgwU=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "A716C979AFDE8CA20294BF182F7DF94BDFBCA82E",
    pub_key: "NuN2+qNdTUY0Zwmzagdm+13C0bRTCVo8Ft5qQsrtCn0=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "42163FEE124FF540A4E5EC7B70D0EF778CDC669E",
    pub_key: "xuIRY06dcl6R1SY5HVAnV9Kl4/GRUd/GRGUjeGVGzbQ=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "74484BFD569330BC824741D483A9FC322364450D",
    pub_key: "ilVyH2bW23kGFhXHjhWQzFierF0ALFssxeDDadSB7fo=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "BDA04DBBFFE00D65B6ADE280863FAB687D90A6E6",
    pub_key: "HO2LQUyzSMkSKUPNpcRkxHaMvust29kH3qQux80dKBo=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "CDB29AD0307CB2767F12F5C97596C067747F50D2",
    pub_key: "yDeFFJnMDMNq1zE7H8Yj2kMxg03NIL1qut7u6ooMab4=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "54A4679209A395F96112EE3E3004A52CD8718377",
    pub_key: "EIh/8w6g39PCqTOAspzzAPSN0wXTQfQ9nBhu04ijlMQ=",
    voting_power: 10,
    proposer_priority: 1,
  },
  {
    address: "DCABA2ABF6379427519E8FAE237EA41632D85264",
    pub_key: "jsTljaKM6nkLO3YK7Po+PX4igccHjzTzz19LLVtN16I=",
    voting_power: 10,
    proposer_priority: 1,
  },
];

const validators1 = data.map((item) => ({
  ...item,
  pub_key: {
    type: "tendermint/PubKeyEd25519",
    value: item.pub_key,
  },
}));

console.log(ValidatorHashInput.encode(validators1[0]).toString("hex"));
console.log(
  Buffer.from(validators1[0].pub_key.value, "base64").toString("hex")
);
