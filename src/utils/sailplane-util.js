
import {randomBytes} from 'libp2p-crypto';
const bip39 = require('bip39');
import OrbitDBAddress from 'orbit-db/src/orbit-db-address';
const { parse } = OrbitDBAddress;

export function addressValid(address) {
  return OrbitDBAddress.isValid(address)
}

const defaultAddressOptions = () => ({
  meta: {
    iv: [...randomBytes(16)]
  },
  accessController: {
    type: 'orbitdb'
  },
});

export function determineAddress(sailplane, options = {}) {
  return sailplane.determineAddress(
    options.name || 'sailplane-web',
    {...defaultAddressOptions(), ...options},
  );
};

export function driveName(address) {
  const bytes = new TextEncoder().encode(parse(address).root);
  return bip39.entropyToMnemonic(bytes.slice(-32))
    .split(' ')
    .slice(-3)
    .join('-');
};

const ipfs = (sailplane) => sailplane._orbitdb._ipfs

export async function addressManifest(sailplane, address) {
  const { value } = await ipfs(sailplane).dag.get(parse(address).root);
  return value;
};

export async function addressManifestACL(sailplane, address) {
  const { accessController } = await addressManifest(sailplane, parse(address));
  const { value } = await ipfs(sailplane).dag.get(accessController);
  return value;
};

const defaultSfsOptions = {
  autoStart: false
};

export function mount(sailplane, address, sfsQueue = {}, options = {}) {
  address = address.toString()
  return sailplane.mounted[address] || sfsQueue[address] ||
    (() => sfsQueue[address] = sailplane
      .mount(address, {...defaultSfsOptions, ...options})
      .finally(() => delete sfsQueue[address])
    )();
};
