import pexpect
import sys
import time

def main():
    print("Starting EAS CLI...")
    child = pexpect.spawn('npx -y eas-cli credentials', encoding='utf-8')
    child.logfile = sys.stdout

    print("\nWaiting for platform selection...")
    child.expect('Select platform')
    time.sleep(1)
    child.send('\r') # Select Android (default)

    print("\nWaiting for build profile...")
    child.expect('Which build profile do you want to configure')
    time.sleep(1)
    child.send('\x1b[B\x1b[B\r') # down twice for production

    print("\nWaiting for credential action (1)...")
    child.expect('What do you want to do')
    time.sleep(1)
    child.send('\r') # Default is Keystore

    print("\nWaiting for Keystore action...")
    child.expect('What do you want to do')
    time.sleep(1)
    child.send('\x1b[B\x1b[B\r') # down twice for download

    print("\nWaiting for sensitive info confirmation...")
    child.expect('Do you want to display the sensitive information')
    time.sleep(1)
    child.send('y\r')

    try:
        child.expect(pexpect.EOF, timeout=10)
    except pexpect.TIMEOUT:
        print("Timeout waiting for EOF. Output might be complete.")

if __name__ == '__main__':
    main()
