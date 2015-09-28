##Decrypt File Task Usage

1. **Cypher**: Encryption cypher to use. See [cypher suite names](http://openssl.org/docs/manmaster/apps/ciphers.html) for a complete list of possible values.
2. **Encrypted File**: Relative path of file to decrypt.
3. **Passphrase**: Passphrase to use for decryption. *Use a Variable to encrypt the passphrase.*
4. **Decrypted File Path**: Optional filename for decrypted file. Defaults to the Encrypted File with a ".out" extension.
5. **Working Directory**: Working directory for decryption. Defaults to the root of the repository.