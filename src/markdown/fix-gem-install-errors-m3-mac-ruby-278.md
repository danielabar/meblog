---
title: "Fixing Gem Install Errors on M3 Mac with Ruby 2.7.8"
featuredImage: "../images/fix-gem-install-issues-julien-pier-belanger-SoFNVdiJQgc-unsplash.jpg"
description: "A guide to resolving common gem installation errors such as `pg`, `nokogiri`, and `msgpack` when setting up a Rails project on an M3 Mac with Ruby 2.7.8, including solutions and troubleshooting steps."
date: "2024-10-01"
category: "rails"
related:
  - "Add Rubocop to an Existing Rails Project"
  - "Dockerize a Rails Application for Development"
  - "Old Ruby and New Mac"
---

When setting up a Rails 6.1 project on an M3 Mac using Ruby 2.7.8, I encountered various issues during `bundle install` for several gems like `pg`, `nokogiri`, and `msgpack`. Below, I’ll walk through each issue, including the error message you might see, an explanation of the issue, and the solution to fix it.

##  Nokogiri

Error during `bundle install`:

```bash
Gem::Ext::BuildError: ERROR: Failed to build gem native extension.
current directory: /path/to/gems/nokogiri-1.15.6/ext/nokogiri
...
Could not create Makefile due to some reason, probably lack of necessary libraries and/or headers.
```

This error usually occurs when `nokogiri` fails to compile due to missing libraries or misconfigured compilation flags. On macOS, it often involves issues with `libxml2` or `iconv`, which `nokogiri` depends on.

**Explanation:**

By default, `nokogiri` attempts to compile its own libraries (like `libxml2`) instead of using the system's version. This can lead to compilation issues, particularly on newer Macs with ARM architecture.

**Solution:**

You can configure Bundler to use the system libraries instead of compiling them. Run the following command:

```bash
bundle config build.nokogiri --use-system-libraries
```

This tells `nokogiri` to use the pre-installed libraries on your system, avoiding the need to compile them manually.

## PostgreSQL pg

Error during `bundle install`:

```bash
checking for pg_config... no
No pg_config... trying anyway. If building fails, please try again with --with-pg-config=/path/to/pg_config
checking for libpq-fe.h... no
Can't find the 'libpq-fe.h header
```

This error occurs when the `pg` gem can’t find PostgreSQL’s development libraries (`libpq`). This often happens when PostgreSQL isn’t installed or its binaries aren’t properly set up in your `PATH`.

**Explanation:**

The `pg` gem requires the PostgreSQL client libraries to be available during installation, and it uses `pg_config` to find the necessary files. Without this configuration, the gem cannot be built.

**Solution:**

Make sure PostgreSQL is installed via Homebrew, and then ensure the `pg_config` binary is available in your `PATH`:

```bash
brew install postgresql@13
export PATH="/opt/homebrew/opt/postgresql@13/bin:$PATH"
```

After running this, try running `bundle install` again, and the `pg` gem should compile successfully.

## Msgpack and Bootsnap

**Error during `bundle install`:**

```bash
buffer_class.c:261:17: error: incompatible function pointer types passing 'VALUE (VALUE)' to parameter of type 'VALUE (*)(VALUE, VALUE)' [-Wincompatible-function-pointer-types]
```

This error shows up when compiling the `msgpack` gem and sometimes the `bootsnap` gem. It's caused by stricter function pointer checks in the C extensions on the ARM architecture of the M3 Mac.

**Explanation:**

The ARM architecture is more sensitive to function pointer types, leading to compilation errors for gems that use native C extensions like `msgpack` and `bootsnap`.

**Solution:**

To bypass this issue, you can add a compiler flag that ignores these errors. Run the following commands to configure Bundler to use this flag when building the affected gems:

```bash
bundle config set --global build.msgpack "--with-cflags=-Wno-error=incompatible-function-pointer-types"
bundle config set --global build.bootsnap "--with-cflags=-Wno-error=incompatible-function-pointer-types"
```

This will suppress the function pointer type warnings and allow the gems to install correctly.

## Conclusion

When encountering gem installation errors on an M3 Mac using Ruby 2.7.8, it’s essential to inspect the installation log files to understand the root cause. Whether it’s missing libraries, incorrect configuration, or ARM-specific compilation issues, using the correct flags and ensuring your environment is properly set up can help resolve the errors. Always check the log file paths provided in the error messages for more detailed information on the issue at hand.

## TODO

* figure out publish date
* get exact error messages from console output
* for nokogiri - first had to find the build log file mentioned in console error `Could not create Makefile due to some reason, probably lack of necessary libraries and/or headers.  Check the mkmf.log file for more details.  You may need configuration options.`, then had to find the specific issue in that log file:
```
try_link_iconv: checking for iconv... -------------------- yes

"clang -o conftest -I/Users/daniela.baron/.rbenv/versions/2.7.8/include/ruby-2.7.0/arm64-darwin23 -I/Users/daniela.baron/.rbenv/versions/2.7.8/include/ruby-2.7.0/ruby/backward -I/Users/daniela.baron/.rbenv/versions/2.7.8/include/ruby-2.7.0 -I. -D_XOPEN_SOURCE -D_DARWIN_C_SOURCE -D_DARWIN_UNLIMITED_SELECT -D_REENTRANT   -g -O2 -fno-common -pipe -std=c99 -Wno-declaration-after-statement -O2 -g -Winline -Wmissing-noreturn -Wshorten-64-to-32 -Wno-unknown-warning-option conftest.c  -L. -L/Users/daniela.baron/.rbenv/versions/2.7.8/lib -L. -fstack-protector-strong  -m64   -lruby.2.7   "
Undefined symbols for architecture arm64:
  "_iconv", referenced from:
      _main in conftest-ea30a6.o
  "_iconv_open", referenced from:
      _main in conftest-ea30a6.o
ld: symbol(s) not found for architecture arm64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
checked program was:
/* begin */
 1: #include "ruby.h"
 2:
 3: #include <stdlib.h>
 4: #include <iconv.h>
 5: int main(void)
 6: {
 7:     iconv_t cd = iconv_open("", "");
 8:     iconv(cd, NULL, NULL, NULL, NULL);
 9:     return EXIT_SUCCESS;
10: }
/* end */
  ```
* WIP intro para
* WIP main content
* edit
